require('dotenv').config()
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { createServer } = require('http'); //http server for socket.io
const socketAuth = require('./middleware/socketAuth');
const Room = require('./models/roomModel');
const Comment = require('./models/comments');
const { v4: uuidv4 } = require('uuid'); //random uuid generator
const watchRoomDelete = require('./middleware/watchRoomDelete'); //expiry

const app = express();
const port = 3000;
const URL = process.env.PORT || 'http://localhost:5173'

app.use(cors({
  // origin: "https://scrib-drib-bnqh.vercel.app",
  origin:"*",
  credentials: true
}));

app.use(express.json());

// Database connection
const mongodbPath = process.env.DATABASEURL
mongoose.connect(mongodbPath).then(() => {
  watchRoomDelete();
}).catch((err) => {
  console.log(err)
})

// Router imports
const HomeRouter = require('./Router/homeRouter');
const AuthRouter = require('./Router/authRouter');
const HistoryRouter = require('./Router/historyRouter');
const SummaryRouter = require('./Router/summaryRouter')

app.use('/', HomeRouter);
app.use('/auth', AuthRouter);
app.use('/history', HistoryRouter);
app.use('/summary', SummaryRouter)

// Error handler
app.use((err, req, res, next) => {
  res.status(400).json({
    message: err.message || "Something went wrong",
  });
});

// ------ HTTP Server and Socket.io setup ------
const server = createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    // origin: "https://scrib-drib-bnqh.vercel.app",
    origin:"*",
    credentials: true
  }
});

// Socket Middleware Token Authentication
io.use(socketAuth)

// Store socket to user mapping
const socketToUser = new Map();

// ---- Socket.io Event Handlers ----
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  const user = socket.user;
  
  // Store socket mapping
  socketToUser.set(socket.id, user);

  // ===== CREATE ROOM =====
  socket.on('createRoom', async ({ roomName }) => {
    try {
      const roomId = uuidv4().replace(/-/g, '').slice(0, 8);

      // Create room in db
      const newRoom = await Room.create({
        roomName,
        host: user._id,
        roomId,
        users: [{
          userId: user._id,
          name: user.fullName,
          socketId: socket.id
        }]
      });

      socket.join(roomId);
      console.log(`Room created: ${roomId} by ${user.fullName}`);

      socket.emit('roomCreated', { roomId, roomName });
    } catch (err) {
      console.log("Create Room Error:", err);
      socket.emit('error', { msg: "Error creating room" });
    }
  });

  // ===== JOIN ROOM =====
  socket.on('joinRoom', async ({ roomId }) => {
    try {
      // Find room and populate chat
      const room = await Room.findOne({ roomId, isActive: true })
        .populate({
          path: 'chat',
          options: { sort: { createdAt: 1 } }
        }).populate('host');
      
      if (!room) {
        return socket.emit('error', { msg: "Room not found or inactive" });
      }

      // Check if user already in room
      const existingUserIndex = room.users.findIndex(
        u => u.userId.toString() === user._id.toString()
      );

      if (existingUserIndex !== -1) {
        // Update socket ID if user reconnecting
        room.users[existingUserIndex].socketId = socket.id;
      } else {
        // Add new user
        room.users.push({
          userId: user._id,
          name: user.fullName,
          socketId: socket.id
        });

        //add to joinedUser array --> this user joined at some point keeping track
        room.joinedUser.push(user._id);
      }

      await room.save();
      socket.join(roomId);

      console.log(`${user.fullName} joined room: ${roomId}`);

      // Parse board data
      let parsedBoard = null;
      try {
        parsedBoard = room.boardData && room.boardData.length > 0
          ? JSON.parse(room.boardData)
          : null;
      } catch (e) {
        console.error("Invalid board JSON");
      }

      // Send room data to joining user
      socket.emit("roomJoined", {
        roomId: room.roomId,
        host: room.host.fullName,
        roomName: room.roomName,
        boardData: parsedBoard,
        users: room.users.map(u => ({ 
          userId: u.userId, 
          name: u.name 
        })),
        currentUser: {
          userId: user._id,
          name: user.fullName
        }
      });

      // Send chat history to joining user
      const chatMessages = room.chat.map(msg => ({
        text: msg.commentText,
        userName: msg.userName,
        userId: msg.userId,
        createdAt: msg.createdAt
      }));
      socket.emit("chat:history", { messages: chatMessages });

      // Notify others in room
      socket.to(roomId).emit('userJoined', {
        userId: user._id,
        name: user.fullName
      });

    } catch (err) {
      console.log("Join Room Error:", err);
      socket.emit('error', { msg: "Error joining room" });
    }
  });

  // ===== BOARD UPDATE ===== - FIXED
  socket.on("board:update", async ({ roomId, boardData }) => {
    try {
      // console.log(`📥 Server received board update from ${user.fullName} for room ${roomId}`);
      
      const serialized = JSON.stringify(boardData); //converting object to string version
      
      //Broadcast to OTHERS only (not sender)
      socket.to(roomId).emit("board:update", boardData);
      
      await Room.findOneAndUpdate(
        { roomId, isActive: true },
        { boardData: serialized }
      );
      // console.log(`📤 Server broadcasted board update to room ${roomId} (excluding sender)`);
    } catch (err) {
      console.error("Board update error:", err);
      socket.emit("error", { msg: "Failed to update board" });
    }
  });

  // ===== REQUEST CHAT HISTORY =====
  socket.on("chat:requestHistory", async ({ roomId }) => {
    try {
      //finding room
      const room = await Room.findOne({ roomId, isActive: true })
        .populate({
          path: 'chat',
          options: { sort: { createdAt: 1 } }
        });

      if (!room) return;

      //return array of all the chat message
      const chatMessages = room.chat.map(msg => ({
        text: msg.commentText,
        userName: msg.userName,
        userId: msg.userId,
        createdAt: msg.createdAt
      }));

      socket.emit("chat:history", { messages: chatMessages });
    } catch (err) {
      console.error("Chat history error:", err);
    }
  });

  // ===== CHAT SEND =====
  socket.on("chat:send", async ({ roomId, message }) => {
    try {
      const room = await Room.findOne({ roomId, isActive: true });
      if (!room) return;

      // Create comment in database
      const newComment = await Comment.create({
        roomId: room._id,
        userId: user._id,
        commentText: message.text,
        userName: message.userName
      });

      // Add to room's chat array
      room.chat.push(newComment._id);
      await room.save();

      // Broadcast to ALL users including sender
      const messageData = {
        text: newComment.commentText,
        userName: newComment.userName,
        userId: newComment.userId,
        createdAt: newComment.createdAt
      };

      io.to(roomId).emit("chat:message", messageData);
    } catch (err) {
      console.error("Chat send error:", err);
    }
  });

  //======Permission=====
socket.on("permission:update", ({ roomId, permitted }) => {
  io.to(roomId).emit("permission:update", { permitted });
});


  // ===== DISCONNECT =====
  socket.on("disconnect", async () => {
    try {
      console.log(`User disconnected: ${socket.id}`);
      
      const disconnectedUser = socketToUser.get(socket.id);
      if (!disconnectedUser) {
        console.log("No user found for socket:", socket.id);
        return;
      }

      // Find the active room where this user exists
      const room = await Room.findOne({
        "users.socketId": socket.id,
        isActive: true,
      });

      if (!room) {
        console.log("No active room found for user");
        socketToUser.delete(socket.id);
        return;
      }

      console.log(`User ${disconnectedUser.fullName} leaving room ${room.roomId}`);

      // Remove user from room
      room.users = room.users.filter(
        (u) => u.socketId !== socket.id
      );

      // Check if host left
      if (room.host.toString() === disconnectedUser._id.toString()) {
        room.isActive = false;
        await room.save();

        // Notify everyone room is closed
        io.to(room.roomId).emit("room-closed");
        
        // Make all sockets leave the room
        const socketsInRoom = await io.in(room.roomId).fetchSockets();
        socketsInRoom.forEach(s => s.leave(room.roomId));
        
        console.log(`Host left. Room ${room.roomId} closed.`);
      } else {
        // Normal user left
        await room.save();
        
        // Notify others
        socket.to(room.roomId).emit("user-left", {
          userId: disconnectedUser._id,
          name: disconnectedUser.fullName,
        });
        
        console.log(`User ${disconnectedUser.fullName} left room ${room.roomId}`);
      }

      // Clean up socket mapping
      socketToUser.delete(socket.id);

    } catch (err) {
      console.error("Disconnect error:", err);
      socketToUser.delete(socket.id);
    }
  });

});

// Listening to port 3000
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});