const jwt = require("jsonwebtoken");
const User = require("../models/authModel"); // authSchema model

module.exports = async (socket, next) => {
  try {
    // get token from handshake
    const token = socket.handshake.auth?.token;

    //if not token found
    if (!token) {
      return next(new Error("No token, authorization denied"));
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWTSECRET);
    if (!decoded) {
      return next(new Error("Token is not valid"));
    }

    //find user
    const user = await User.findOne({ _id: decoded.id }).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    //attach user to socket
    socket.user = user;

    next(); // allow connection
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication failed"));
  }
};
