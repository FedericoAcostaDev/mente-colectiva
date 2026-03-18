import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, MessageSquare, X, User } from "lucide-react";
import api from "../../API/axios";
import "./WhiteboardHistoryPage.css";

const BG_COLOR = "#020617";

function WhiteboardHistoryPage() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const fabricCanvas = useRef(null);
    const chatEndRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [boardData, setBoardData] = useState(null);
    const [chats, setChats] = useState([]);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Fetch board data from API
    useEffect(() => {
        const fetchBoardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await api.get(`/history/${roomId}`);

                const roomExist = response.data?.objectData;

                let parsed = roomExist.boardData;

                if (typeof parsed === "string") {
                    parsed = JSON.parse(parsed);
                }

                setBoardData(parsed);
                setChats(roomExist.chat || []);

            } catch (err) {
                console.error("Error fetching board:", err);
                setError(err.response?.data?.msg || err.message || "Failed to load whiteboard");
            } finally {
                setLoading(false);
            }
        };

        if (roomId) {
            fetchBoardData();
        }
    }, [roomId]);

    // Auto-scroll chat to bottom
    useEffect(() => {
        if (chatEndRef.current && isChatOpen) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chats, isChatOpen]);

    // Initialize Fabric.js canvas
    useEffect(() => {
        if (!canvasRef.current) return;
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: window.innerWidth - (isChatOpen && window.innerWidth >= 768 ? 384 : 0),
            height: window.innerHeight - 64,
            backgroundColor: BG_COLOR,
            isDrawingMode: false,
            selection: false,
            renderOnAddRemove: true,
            enableRetinaScaling: true,
        });

        fabricCanvas.current = canvas;

        canvas.forEachObject((obj) => {
            obj.selectable = false;
            obj.evented = false;
        });

        const handleResize = () => {
            canvas.setDimensions({
                width: window.innerWidth - (isChatOpen && window.innerWidth >= 768 ? 384 : 0),
                height: window.innerHeight - 64,
            });
            canvas.renderAll();
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            canvas.dispose();
        };
    }, []);

    // Resize canvas when chat opens/closes
    useEffect(() => {
        if (fabricCanvas.current) {
            fabricCanvas.current.setDimensions({
                width: window.innerWidth - (isChatOpen && window.innerWidth >= 768 ? 384 : 0),
                height: window.innerHeight - 64,
            });
            fabricCanvas.current.renderAll();
        }
    }, [isChatOpen]);

    // Load board data into canvas
    useEffect(() => {
        if (!fabricCanvas.current) return;
        if (!boardData) return;
        if (loading) return;

        try {
            fabricCanvas.current.loadFromJSON(boardData, () => {
                fabricCanvas.current.renderAll();
            });
        } catch (err) {
            console.error("Error rendering board:", err);
            setError("Failed to render whiteboard data");
        }
    }, [boardData, loading]);

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };


    return (
        <div className="wb-container">
            {/* Header */}
            <div className="wb-header">
                <div className="wb-header-left">
                    <button onClick={() => navigate(-1)} className="wb-back-btn" title="Go Back">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="wb-header-title">Whiteboard History</h1>
                </div>
                <div className="wb-header-right">
                    <button
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        className="wb-chat-toggle-mobile"
                        title="Toggle Chat"
                    >
                        <MessageSquare size={20} />
                        {chats.length > 0 && (
                            <span className="wb-chat-badge">{chats.length}</span>
                        )}
                    </button>
                    <span className="wb-readonly-badge">Read Only</span>
                    <span className="wb-room-id">Room: {roomId}</span>
                </div>
            </div>

            <div className="wb-main">
                {/* Canvas Container */}
                <div className="wb-canvas-container">
                    <canvas ref={canvasRef} className="wb-canvas" ></canvas>

                    {/* Info Footer */}
                    <div className="wb-info-footer">
                        <p className="wb-info-text">
                            <span className="wb-status-dot"></span>
                            <span className="wb-info-label">Viewing saved whiteboard (read-only)</span>
                        </p>
                    </div>
                </div>

                {/* Chat Sidebar - Desktop */}
                <div className={`wb-chat-sidebar ${isChatOpen ? 'wb-chat-open' : ''}`}>
                    <div className="wb-chat-header">
                        <div className="wb-chat-header-left">
                            <MessageSquare size={20} className="wb-chat-icon" />
                            <h2 className="wb-chat-title">Chat History</h2>
                            <span className="wb-chat-count">{chats.length}</span>
                        </div>
                        <button onClick={() => setIsChatOpen(false)} className="wb-chat-close">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="wb-chat-messages">
                        {chats.length === 0 ? (
                            <div className="wb-chat-empty">
                                <MessageSquare size={48} className="wb-chat-empty-icon" />
                                <p className="wb-chat-empty-text">No messages in this room</p>
                            </div>
                        ) : (
                            chats.map((chat, index) => (
                                <div key={index} className="wb-chat-message">
                                    <div className="wb-chat-avatar">
                                        {chat.userName?.charAt(0).toUpperCase() || <User size={16} />}
                                    </div>
                                    <div className="wb-chat-content">
                                        <div className="wb-chat-meta">
                                            <span className="wb-chat-username">
                                                {chat.userName || 'Anonymous'}
                                            </span>
                                            <span className="wb-chat-time">
                                                {chat.createdAt ? formatTime(chat.createdAt) : ''}
                                            </span>
                                        </div>
                                        <p className="wb-chat-text">{chat.commentText}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                {/* Chat Sidebar - Mobile (Full Screen Overlay) */}
                {isChatOpen && (
                    <div className="wb-chat-mobile">
                        <div className="wb-chat-header">
                            <div className="wb-chat-header-left">
                                <MessageSquare size={20} className="wb-chat-icon" />
                                <h2 className="wb-chat-title">Chat History</h2>
                                <span className="wb-chat-count">{chats.length}</span>
                            </div>
                            <button onClick={() => setIsChatOpen(false)} className="wb-chat-close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="wb-chat-messages wb-chat-messages-mobile">
                            {chats.length === 0 ? (
                                <div className="wb-chat-empty">
                                    <MessageSquare size={48} className="wb-chat-empty-icon" />
                                    <p className="wb-chat-empty-text">No messages in this room</p>
                                </div>
                            ) : (
                                chats.map((chat, index) => (
                                    <div key={index} className="wb-chat-message">
                                        <div className="wb-chat-avatar">
                                            {chat.userName?.charAt(0).toUpperCase() || <User size={16} />}
                                        </div>
                                        <div className="wb-chat-content">
                                            <div className="wb-chat-meta">
                                                <span className="wb-chat-username">
                                                    {chat.userName || 'Anonymous'}
                                                </span>
                                                <span className="wb-chat-time">
                                                    {chat.createdAt ? formatTime(chat.createdAt) : ''}
                                                </span>
                                            </div>
                                            <p className="wb-chat-text">{chat.commentText}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* Floating Chat Toggle Button - Desktop */}
            {!isChatOpen && (
                <button onClick={() => setIsChatOpen(true)} className="wb-chat-fab" title="Open Chat">
                    <MessageSquare size={24} />
                    {chats.length > 0 && (
                        <span className="wb-chat-fab-badge">{chats.length}</span>
                    )}
                </button>
            )}
        </div>
    );
}

export default WhiteboardHistoryPage;