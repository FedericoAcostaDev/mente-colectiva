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
            <p style={{ fontFamily: "'Kalam', cursive", fontSize: "0.85rem", color: "var(--ink-muted)" }}>Host: {hostName}</p>
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
      <p style={{ opacity: 0.7, fontSize: "0.85rem", padding: "10px", fontFamily: "'Kalam', cursive", fontStyle: "italic", color: "var(--ink-muted)" }}>
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
    <div style={{ padding: "16px", textAlign: "center", fontFamily: "'Kalam', cursive" }}>

      <style>{`
        .summary-output pre {
          white-space: pre-wrap;
          background: var(--paper-dark);
          color: var(--ink);
          padding: 14px;
          border-radius: 3px;
          font-family: "Kalam", cursive;
          font-size: 0.875rem;
          line-height: 1.55;
          text-align: left;
          border: 1.5px dashed var(--sketch-border);
          overflow-x: auto;
        }
      `}</style>

      <div className="flex justify-around items-center">
        <button
          style={{
            fontFamily: "'Kalam', cursive",
            fontWeight: "700",
            padding: "8px 18px",
            background: "var(--ink)",
            color: "var(--paper)",
            border: "2px solid var(--sketch-border)",
            borderRadius: "3px",
            boxShadow: "3px 3px 0 var(--sketch-border)",
            cursor: "pointer",
            fontSize: "0.9rem",
            transition: "transform 0.1s",
          }}
          onClick={handleOnClick}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Summary"}
        </button>
        {summary &&
          <button onClick={() => navigator.clipboard.writeText(summary)}
            style={{
              fontSize: "1.2rem",
              padding: "5px 10px",
              border: "1.5px solid var(--sketch-border)",
              borderRadius: "3px",
              background: "var(--paper)",
              cursor: "pointer",
              boxShadow: "2px 2px 0 var(--sketch-border)",
            }}
            title="Copy Summary">
            📋
          </button>
        }
      </div>
      {summary && (
        <div className="summary-output" style={{ marginTop: "16px" }}>
          <div dangerouslySetInnerHTML={{ __html: summary }} />
        </div>
      )}
    </div>
  );
}

//////////////// STYLES //////////////////

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--paper)",
    color: "var(--ink)",
    display: "flex",
    fontFamily: "'Kalam', cursive",
  },

  boardArea: {
    flex: 1,
    margin: "10px",
    border: "2px solid var(--sketch-border)",
    borderRadius: "3px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: "4px 4px 0 var(--sketch-border)",
  },

  roomHeader: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 12px",
    borderBottom: "2px solid var(--sketch-border)",
    flexShrink: 0,
    background: "var(--paper-dark)",
    alignItems: "center",
  },

  roomIdBox: { display: "flex", alignItems: "center", gap: "6px" },
  roomText: { fontFamily: "'Kalam', cursive", fontWeight: "700", fontSize: "0.9rem", color: "var(--ink)" },

  copyIcon: {
    border: "1.5px solid var(--sketch-border)",
    background: "var(--paper)",
    borderRadius: "3px",
    padding: "3px 7px",
    cursor: "pointer",
    boxShadow: "2px 2px 0 var(--sketch-border)",
    transition: "transform 0.1s",
    fontSize: "0.85rem",
  },

  headerActions: { display: "flex", gap: "8px", alignItems: "center" },

  voiceBtn: {
    border: "1.5px solid var(--sketch-border)",
    background: "var(--paper)",
    borderRadius: "3px",
    padding: "5px 10px",
    cursor: "pointer",
    boxShadow: "2px 2px 0 var(--sketch-border)",
    transition: "transform 0.1s",
    fontFamily: "'Kalam', cursive",
    color: "var(--ink)",
  },

  voiceBtnOff: {
    border: "1.5px solid var(--sketch-red)",
    background: "rgba(220,38,38,0.08)",
    borderRadius: "3px",
    padding: "5px 10px",
    cursor: "pointer",
    boxShadow: "2px 2px 0 var(--sketch-red)",
    transition: "transform 0.1s",
    fontFamily: "'Kalam', cursive",
    color: "var(--sketch-red)",
  },

  drawBtn: {
    border: "1.5px solid var(--sketch-border)",
    background: "var(--paper)",
    borderRadius: "3px",
    padding: "5px 9px",
    cursor: "pointer",
    fontSize: "0.9rem",
    boxShadow: "2px 2px 0 var(--sketch-border)",
    transition: "transform 0.1s",
  },

  micSlash: {
    position: "absolute",
    top: "-2px",
    left: "6px",
    color: "var(--sketch-red)",
    fontWeight: "800",
    fontSize: "18px",
  },

  leaveBtn: {
    background: "var(--ink)",
    border: "1.5px solid var(--sketch-border)",
    borderRadius: "3px",
    padding: "5px 12px",
    color: "var(--paper)",
    cursor: "pointer",
    fontFamily: "'Kalam', cursive",
    fontWeight: "700",
    boxShadow: "2px 2px 0 var(--sketch-border)",
    transition: "transform 0.1s, box-shadow 0.1s",
    fontSize: "0.9rem",
  },

  rightPanel: {
    width: "320px",
    margin: "10px",
    border: "2px solid var(--sketch-border)",
    borderRadius: "3px",
    display: "flex",
    flexDirection: "column",
    height: "calc(100vh - 20px)",
    overflow: "hidden",
    boxShadow: "4px 4px 0 var(--sketch-border)",
    background: "var(--paper-dark)",
  },

  tabs: {
    display: "flex",
    gap: "4px",
    padding: "8px",
    flexShrink: 0,
    borderBottom: "2px solid var(--sketch-border)",
    background: "var(--paper-darker)",
  },

  tab: {
    flex: 1,
    padding: "7px 4px",
    background: "var(--paper)",
    borderRadius: "3px",
    border: "1.5px solid var(--sketch-border)",
    cursor: "pointer",
    fontFamily: "'Kalam', cursive",
    fontSize: "0.75rem",
    color: "var(--ink-muted)",
    transition: "background 0.15s",
  },

  activeTab: {
    flex: 1,
    padding: "7px 4px",
    background: "var(--ink)",
    color: "var(--paper)",
    borderRadius: "3px",
    fontFamily: "'Kalam', cursive",
    fontWeight: "700",
    fontSize: "0.75rem",
    border: "1.5px solid var(--sketch-border)",
    cursor: "pointer",
    boxShadow: "2px 2px 0 var(--sketch-border)",
  },

  tabContent: {
    flex: 1,
    padding: "10px",
    overflow: "auto",
  },
};

const chatStyles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    maxHeight: "100%",
    fontFamily: "'Kalam', cursive",
  },

  messages: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingRight: "4px",
    marginBottom: "8px",
    minHeight: 0,
  },

  messageCard: {
    background: "var(--paper)",
    border: "1.5px solid var(--sketch-border)",
    borderRadius: "3px",
    padding: "8px 10px 18px 10px",
    position: "relative",
    flexShrink: 0,
    boxShadow: "2px 2px 0 var(--sketch-border)",
  },

  userName: {
    fontFamily: "'Caveat', cursive",
    fontWeight: "700",
    fontSize: "0.9rem",
    marginBottom: "3px",
    color: "var(--ink)",
  },

  messageText: {
    marginBottom: "4px",
    fontSize: "0.9rem",
    lineHeight: "1.4",
    wordWrap: "break-word",
    color: "var(--ink-light)",
  },

  time: {
    fontFamily: "'Kalam', cursive",
    fontSize: "0.7rem",
    color: "var(--ink-faint)",
    position: "absolute",
    bottom: "4px",
    right: "8px",
  },

  inputBox: {
    display: "flex",
    gap: "6px",
    borderTop: "2px solid var(--sketch-border)",
    paddingTop: "8px",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    padding: "8px 10px",
    borderRadius: "3px",
    border: "1.5px solid var(--sketch-border)",
    background: "var(--paper)",
    color: "var(--ink)",
    fontFamily: "'Kalam', cursive",
    fontSize: "0.9rem",
    outline: "none",
  },

  sendBtn: {
    padding: "8px 12px",
    background: "var(--ink)",
    color: "var(--paper)",
    borderRadius: "3px",
    border: "1.5px solid var(--sketch-border)",
    cursor: "pointer",
    fontSize: "1rem",
    boxShadow: "2px 2px 0 var(--sketch-border)",
    transition: "transform 0.1s",
  },
};

const memberStyles = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 6px",
    borderBottom: "1.5px dashed var(--sketch-border)",
    transition: "background 0.15s",
    fontFamily: "'Kalam', cursive",
  },

  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "var(--ink)",
    border: "1.5px solid var(--sketch-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Caveat', cursive",
    fontWeight: "700",
    fontSize: "0.9rem",
    color: "var(--paper)",
    boxShadow: "2px 2px 0 var(--sketch-border)",
  },

  name: {
    fontFamily: "'Kalam', cursive",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "var(--ink)",
  },

  actions: {
    display: "flex",
    gap: "6px",
  },
};