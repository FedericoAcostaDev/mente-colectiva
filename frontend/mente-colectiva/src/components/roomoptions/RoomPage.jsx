import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../../Socket/ws";
import { toast } from "react-toastify";
import Whiteboard from "../WhiteBoardLibrary/WhiteBoard";
import api from "../../API/axios";

function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("members");
  const [micOn, setMicOn] = useState(true);
  const [members, setMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const boardRef = useRef(null);
  const hasJoined = useRef(false);
  const [hostName, setHostName] = useState("");
  const [summary, setSummary] = useState('');
  const [permittedMember, setPermittedMember] = useState([]);

  useEffect(() => {

    if (!roomId) {
      navigate("/");
      return;
    }

    // Connect socket immediately if not connected
    if (!socket.connected) {
      socket.connect();
      // navigate('/');
    }

    // Wait for connection before joining
    const attemptJoin = () => {
      if (socket.connected && !hasJoined.current) {
        socket.emit("joinRoom", { roomId });
        hasJoined.current = true;
      }
    };

    if (socket.connected) {
      attemptJoin();
    } else {
      socket.on("connect", attemptJoin);
    }

    //room joined function
    const handleRoomJoined = ({ roomName, users, boardData, currentUser: user, host }) => {
      console.log("Room joined:", { roomName, users, boardData });
      if (boardData) {
        boardRef.current = boardData;
      }
      if (user) {
        setCurrentUser(user);
      }
      if (host) {
        setHostName(host);
      }

      toast.success(`Joined room: ${roomName}`);
      setMembers(users || []);
    };

    //handle user joined
    const handleUserJoined = ({ userId, name }) => {
      console.log("User joined:", { userId, name });
      setMembers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, name }];
      });
      sessionStorage.setItem("inRoom", "true");
      toast.info(`${name} joined the room`);
    };

    //handle user joined
    const handleUserLeft = ({ userId, name }) => {
      console.log("User left:", { userId, name });
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.info(`${name} left the room`);
    };

    //handle room closed
    const handleRoomClosed = () => {
      toast.error("Host left. Room closed.");
      socket.disconnect();
      navigate("/");
    };

    // permission update
    socket.on("permission:update", ({ permitted }) => {
      setPermittedMember(permitted);
      toast.info("Permissions updated");
    });

    const handleError = ({ msg }) => {
      toast.error(msg || "An error occurred");
      navigate("/");
    };

    socket.on("roomJoined", handleRoomJoined);
    socket.on("userJoined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("room-closed", handleRoomClosed);
    socket.on("error", handleError);

    return () => {
      socket.off("connect", attemptJoin);
      socket.off("roomJoined", handleRoomJoined);
      socket.off("userJoined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("room-closed", handleRoomClosed);
      socket.off("permission:update");
      socket.off("error", handleError);
    };
  }, [roomId, navigate]);



  const handleLeave = () => {
    socket.disconnect();
    hasJoined.current = false;
    navigate("/");
  };


  const handlePermission = (id) => {
    const updated = permittedMember.includes(id)
      ? permittedMember.filter(x => x !== id)
      : [...permittedMember, id];

    // Update host UI immediately
    setPermittedMember(updated);

    // Broadcast to room
    socket.emit("permission:update", {
      roomId,
      permitted: updated
    });
  }


  return (
    <div style={styles.page}>
      {/* LEFT – WHITEBOARD */}
      <div style={styles.boardArea}>
        <div style={styles.roomHeader}>
          <div style={styles.roomIdBox}>
            <span style={styles.roomText}>Room ID: {roomId}</span>
            <button
              style={styles.copyIcon}
              onClick={() => {
                navigator.clipboard.writeText(roomId);
                toast.success("Copied to clipboard");
              }}
            >
              📋
            </button>
            <button
              style={styles.copyIcon}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/joinRoom?rid=${roomId}`);
                toast.success("Link to clipboard");
              }}
            >
              🔗
            </button>
          </div>

          <div style={styles.headerActions}>
            <p>Host Name: {hostName}</p>
            <button
              style={micOn ? styles.voiceBtn : styles.voiceBtnOff}
              onClick={() => setMicOn(!micOn)}
            >
              <MicIcon isOn={micOn} />
            </button>

            <button style={styles.leaveBtn} onClick={handleLeave}>
              Leave
            </button>
          </div>
        </div>
        {
          currentUser &&
          <Whiteboard roomId={roomId} initialBoard={boardRef.current} permittedMember={permittedMember} currentUser={currentUser} hostName={hostName} />
        }
      </div>

      {/* RIGHT PANEL */}
      <div style={styles.rightPanel}>
        <div style={styles.tabs}>
          <button
            style={activeTab === "members" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("members")}
          >
            Members ({members.length})
          </button>
          <button
            style={activeTab === "chat" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("chat")}
          >
            ChatBox
          </button>
          <button
            style={activeTab === "image" ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab("image")}
          >
            Summary Generation
          </button>
        </div>

        <div style={styles.tabContent}>
          {activeTab === "members" && <Members members={members} hostName={hostName} handlePermission={handlePermission} currentUser={currentUser} permittedMember={permittedMember} />}
          {activeTab === "chat" && <ChatBox roomId={roomId} currentUser={currentUser} />}
          {activeTab === "image" && <SummaryGeneration roomId={roomId} setSummary={setSummary} summary={summary} />}
        </div>
      </div>
    </div>
  );
}

export default RoomPage;

//////////////// COMPONENTS //////////////////

function MicIcon({ isOn }) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <span style={{ fontSize: "16px" }}>🎙️</span>
      {!isOn && <span style={styles.micSlash}>/</span>}
    </span>
  );
}

function Members({ members, hostName, handlePermission, currentUser, permittedMember }) {
  if (!members || members.length === 0) {
    return (
      <p style={{ opacity: 0.6, fontSize: "13px", padding: "10px" }}>
        No members in room yet...
      </p>
    );
  }

  return (
    <div>
      {members.map((m) => (
        <div key={m.userId} style={memberStyles.row}>
          <div style={memberStyles.userInfo}>
            <div style={memberStyles.avatar} className={`${m.userId === currentUser.userId ? 'border-8 border-emerald-500' : ''}`}>
              {m.name ? m.name.charAt(0).toUpperCase() : "?"}
            </div>
            <span style={memberStyles.name} className={`${permittedMember.includes(m.userId) ? 'text-red-200' : ''}`}>{m.name || "Anonymous"}</span>
          </div>

          <div style={memberStyles.actions}>
            <button style={styles.voiceBtn} title="Mic">
              🎙️
            </button>

            {
              (currentUser.name === hostName && m.name !== hostName) &&
              <button style={styles.drawBtn} title="Draw permission" onClick={() => { handlePermission(m.userId) }}>
                {
                  permittedMember.includes(m.userId) ? '❌' : '✏️'
                }

              </button>
            }

          </div>
        </div>
      ))}
    </div>
  );
}

function ChatBox({ roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const hasLoadedHistory = useRef(false);

  useEffect(() => {
    // Load chat history when component mounts
    const loadChatHistory = ({ messages: chatHistory }) => {
      if (!hasLoadedHistory.current) {
        setMessages(chatHistory || []);
        hasLoadedHistory.current = true;
      }
    };

    // Listen for new chat messages from server
    const handleChatMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on("chat:history", loadChatHistory);
    socket.on("chat:message", handleChatMessage);

    // Request chat history
    socket.emit("chat:requestHistory", { roomId });

    return () => {
      socket.off("chat:history", loadChatHistory);
      socket.off("chat:message", handleChatMessage);
    };
  }, [roomId]);

  const sendMessage = () => {
    if (!input.trim() || !currentUser) return;

    const message = {
      text: input,
      userName: currentUser.name,
      userId: currentUser.userId,
    };

    // Emit to server (server will broadcast to all including sender)
    socket.emit("chat:send", { roomId, message });

    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={chatStyles.wrapper}>
      <div style={chatStyles.messages}>
        {messages.length === 0 ? (
          <p style={{ opacity: 0.5, fontSize: "13px", textAlign: "center", marginTop: "20px" }}>
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((m, idx) => (
            <div key={idx} style={chatStyles.messageCard}>
              <div style={chatStyles.userName}>{m.userName}</div>
              <div style={chatStyles.messageText}>{m.text}</div>
              <div style={chatStyles.time}>
                {new Date(m.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={chatStyles.inputBox}>
        <input
          style={chatStyles.input}
          value={input}
          placeholder="Type a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={chatStyles.sendBtn} onClick={sendMessage}>
          ➤
        </button>
      </div>
    </div>
  );
}

function SummaryGeneration({ roomId, setSummary, summary }) {

  const [loading, setLoading] = useState(false);

  const handleOnClick = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(`/summary/${roomId}`);
      setSummary(data.output);
    } catch (err) {
      toast.error(err.message?.data?.msg || "something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", textAlign: "center", opacity: 0.9 }}>

      {/* ⭐ INLINE STYLE TAG FOR PERFECT FORMATTING */}
      <style>{`
        .summary-output pre {
          white-space: pre-wrap;
          background: #0d0d0d;
          color: #e8e8e8;
          padding: 16px;
          border-radius: 8px;
          font-family: "Fira Code", "Consolas", "Menlo", monospace;
          font-size: 14px;
          line-height: 1.55;
          text-align: left;
          border: 1px solid #333;
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
          overflow-x: auto;
        }
      `}</style>

      <div className="flex justify-around items-center">
        <button
          className="text-white border border-white hover:bg-white hover:text-black transition-all shadow-md shadow-white rounded"
          style={{ padding: "10px 20px" }}
          onClick={handleOnClick}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Summary!"}
        </button>
        {
          summary &&
          <button onClick={() => navigator.clipboard.writeText(summary)} className="text-2xl rounded hover:bg-white relative after:content-['Copy Summary'] after:absolute after:bottom-50 after:w-50 after:h-50 after:bg-amber-300 " style={{ padding: "5px 10px" }}>
            📋
          </button>
        }

      </div>
      {
        summary && (
          <div className="summary-output" style={{ marginTop: "20px" }}>
            <div dangerouslySetInnerHTML={{ __html: summary }} />
          </div>
        )
      }

    </div>
  );
}

//////////////// STYLES //////////////////

const styles = {
  page: {
    minHeight: "100vh",
    background: "#020817",
    color: "#f8fafc",
    display: "flex",
  },

  boardArea: {
    flex: 1,
    margin: "10px",
    border: "1.5px solid rgba(255,255,255,0.25)",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  roomHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    flexShrink: 0,
  },

  roomIdBox: { display: "flex", alignItems: "center", gap: "6px" },
  roomText: { fontWeight: "600", fontSize: "14px" },

  copyIcon: {
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "6px",
    padding: "3px 6px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  headerActions: { display: "flex", gap: "8px" },

  voiceBtn: {
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  voiceBtnOff: {
    border: "1px solid rgba(255,0,0,0.6)",
    background: "rgba(255,0,0,0.15)",
    borderRadius: "6px",
    padding: "6px 12px",
    cursor: "pointer",
    transition: "all 0.2s",
  },

  drawBtn: {
    border: "1px solid rgba(255,255,255,0.4)",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "6px",
    padding: "6px 10px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s",
  },

  micSlash: {
    position: "absolute",
    top: "-2px",
    left: "6px",
    color: "red",
    fontWeight: "800",
    fontSize: "18px",
  },

  leaveBtn: {
    background: "linear-gradient(135deg,#ef4444,#dc2626)",
    border: "none",
    borderRadius: "6px",
    padding: "6px 12px",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s",
    fontSize: "14px",
  },

  rightPanel: {
    width: "340px",
    margin: "10px",
    border: "1.5px solid rgba(255,255,255,0.25)",
    borderRadius: "14px",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 20px)",
    overflow: "hidden",
  },

  tabs: {
    display: "flex",
    gap: "6px",
    padding: "10px",
    flexShrink: 0,
  },

  tab: {
    flex: 1,
    padding: "8px",
    background: "#020817",
    borderRadius: "8px",
    border: "1px solid #0c0d0dff",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s",
  },

  activeTab: {
    flex: 1,
    padding: "8px",
    background: "#ebeff1ff",
    color: "#020817",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "12px",
    border: "none",
    cursor: "pointer",
  },

  tabContent: {
    flex: 1,
    padding: "12px",
    overflow: "auto",
  },
};

const chatStyles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    maxHeight: "100%",
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingRight: "5px",
    marginBottom: "10px",
    minHeight: 0,
  },

  messageCard: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "8px 10px 18px 10px",
    position: "relative",
    flexShrink: 0,
  },

  userName: {
    fontWeight: "600",
    fontSize: "13px",
    marginBottom: "4px",
    color: "#60a5fa",
  },

  messageText: {
    marginBottom: "6px",
    fontSize: "14px",
    lineHeight: "1.4",
    wordWrap: "break-word",
  },

  time: {
    fontSize: "11px",
    color: "#9ca3af",
    position: "absolute",
    bottom: "4px",
    right: "8px",
  },

  inputBox: {
    display: "flex",
    gap: "6px",
    borderTop: "1px solid rgba(255,255,255,0.2)",
    paddingTop: "10px",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.3)",
    background: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: "14px",
    outline: "none",
  },

  sendBtn: {
    padding: "8px 12px",
    background: "#2563eb",
    color: "white",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    transition: "all 0.2s",
  },
};

const memberStyles = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 8px",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    transition: "background 0.2s",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    color: "white",
  },

  name: {
    fontSize: "14px",
    fontWeight: "500",
  },

  actions: {
    display: "flex",
    gap: "8px",
  },
};