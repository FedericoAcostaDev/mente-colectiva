
const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--paper)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontFamily: "'Kalam', cursive",
  },
  heading: {
    fontFamily: "'Caveat', cursive",
    color: "var(--ink)",
    fontSize: "2.6rem",
    fontWeight: "700",
    marginBottom: "40px",
    textDecoration: "underline",
    textDecorationStyle: "wavy",
    textUnderlineOffset: "5px",
  },
  container: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "40px",
  },
  box: {
    background: "var(--paper-dark)",
    padding: "40px",
    borderRadius: "3px",
    width: "300px",
    textAlign: "center",
    border: "2px solid var(--sketch-border)",
    boxShadow: "5px 5px 0 var(--sketch-border)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  glowLeft: {
    borderLeft: "4px solid var(--sketch-border)",
  },
  glowRight: {
    borderRight: "4px solid var(--sketch-border)",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    margin: "16px 0",
    borderRadius: "3px",
    border: "2px solid var(--sketch-border)",
    background: "var(--paper)",
    color: "var(--ink)",
    fontFamily: "'Kalam', cursive",
    fontSize: "1rem",
    outline: "none",
  },
  primaryBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "3px",
    border: "2px solid var(--sketch-border)",
    background: "var(--ink)",
    color: "var(--paper)",
    fontFamily: "'Kalam', cursive",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "3px 3px 0 var(--sketch-border)",
    transition: "transform 0.1s, box-shadow 0.1s",
  },
  secondaryBtn: {
    width: "100%",
    padding: "12px",
    borderRadius: "3px",
    border: "2px solid var(--sketch-border)",
    background: "var(--paper-darker)",
    color: "var(--ink)",
    fontFamily: "'Kalam', cursive",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
    boxShadow: "3px 3px 0 var(--sketch-border)",
    transition: "transform 0.1s, box-shadow 0.1s",
  },
};
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { socket } from "../../Socket/ws";
import { toast } from "react-toastify";

function RoomOptions() {
  const [roomName, setRoomName] = useState("");
  const [searchParam, setSearchParam] = useSearchParams();
  const [roomId, setRoomId] = useState(searchParam.get("rid") || "");
  const [joining ,setJoining] = useState(false);
  const navigate = useNavigate();


  // ================= CREATE ROOM =================
  const handleCreate = () => {
    if (!roomName.trim()) return toast.warning("Enter room name");

    if (!socket.connected) socket.connect(); //if not connected make connection

    socket.emit("createRoom", { roomName }); //emit event

    //catch event from backend
    socket.once("roomCreated", ({ roomId }) => {
      setJoining(true);

      //debounce
      setTimeout(() => {
           navigate(`/room/${roomId}`);
      }, 300);
    });

    socket.once("error", (msg) => {
      console.log(msg);
      alert(msg);
    });
  };

  // ================= JOIN ROOM =================
  const handleJoin = () => {
    if (!roomId.trim()) return toast.warning("Enter room ID");

    if (!socket.connected) socket.connect();

    //event emit
    socket.emit("joinRoom", { roomId });

    //catch event from backend
    socket.once("roomJoined", ({ roomId,  }) => {
      setJoining(true);

      setTimeout(() => {
           navigate(`/room/${roomId}`);
      }, 300);
    });

    socket.once("error", (msg) => {
      toast.error(msg);
      console.log(msg);
      // alert(msg);
    });
  };

  return (
    joining ?  
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(245,240,232,0.85)",
        color: "var(--ink)",
        fontFamily: "'Caveat', cursive",
        fontSize: "1.8rem",
        fontWeight: "700",
        opacity: joining ? 1 : 0,
        pointerEvents: joining ? "auto" : "none",
        transition: "opacity 0.3s ease-in-out",
        zIndex: 10,
        border: "2px dashed var(--sketch-border)",
      }}
    >
      ✏️ Joining room...
    </div> : 
    <div style={styles.page}>
      <h1 style={styles.heading}>Start a Session ✏️</h1>

      <div style={styles.container}>
        <div style={{ ...styles.box, ...styles.glowLeft }}>
          <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: "1.5rem", fontWeight: "700", color: "var(--ink)", marginBottom: "8px" }}>Create Room</h2>
          <input
            style={styles.input}
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />
          <button style={styles.primaryBtn} onClick={handleCreate}>
            Create
          </button>
        </div>

        <div style={{ ...styles.box, ...styles.glowRight }}>
          <h2 style={{ fontFamily: "'Caveat', cursive", fontSize: "1.5rem", fontWeight: "700", color: "var(--ink)", marginBottom: "8px" }}>Join Room</h2>
          <input
            style={styles.input}
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button style={styles.secondaryBtn} onClick={handleJoin}>
            Join
          </button>
        </div>
      </div>
    </div>
    
  )
}

export default RoomOptions;
