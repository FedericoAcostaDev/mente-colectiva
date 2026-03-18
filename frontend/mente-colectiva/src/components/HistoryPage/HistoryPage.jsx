import { useEffect, useState } from "react";
import { ArrowLeft, Play, Calendar, User,Download  } from "lucide-react";
import {Circles} from 'react-loader-spinner'
import { useNavigate, Link } from "react-router-dom";
import "./HistoryPage.css";
import api from "../../API/axios";
import { toast } from "react-toastify";
import jsPDF from "jspdf";

export default function HistoryPage() {
  const navigate = useNavigate();
  const [historyMine, setHistoryMine] = useState([]);
  const [historyJoined, setHistoryJoined] = useState([]);
  const [createdHistory, setCreatedHistory] = useState(true);
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    setLoading(true);

    //get request to fetch joined history
    const fetchJoinedHistory = async () => {
      try {
        const { data } = await api.get('/history');
        setHistoryJoined(data.roomsJoined);
        setHistoryMine(data.roomsCreated);
        setLoading(false);
      } catch (err) {
        toast.error("Error fetching history data");
        console.error("Error fetching history data:", err);
        setLoading(false);
      }
    }

    fetchJoinedHistory();

  }, []);

  //pdf download button
  const downloadHistoryAsPDF = async (room) => {
    // Parse boardData if it's a string
    let boardData = room.boardData;
    if (typeof boardData === 'string') {
      try {
        boardData = JSON.parse(boardData);
      } catch (e) {
        toast.error("Invalid board data format");
        return;
      }
    }

    if (!boardData) {
      toast.error("No board data available for this room");
      return;
    }

    try {
      // Create temporary canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = window.innerWidth;
      tempCanvas.height = window.innerHeight - 64;

      const fabricCanvas = new fabric.Canvas(tempCanvas, {
        backgroundColor: '#020617',
      });

      // Load board data
      await new Promise((resolve) => {
        fabricCanvas.loadFromJSON(boardData, () => {
          fabricCanvas.renderAll();
          resolve();
        });
      });

      // Export as PNG for PDF
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });

      // Create PDF
      const canvasWidth = fabricCanvas.width;
      const canvasHeight = fabricCanvas.height;

      const pdf = new jsPDF({
        orientation: canvasWidth > canvasHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasWidth, canvasHeight]
      });

      pdf.addImage(dataURL, 'PNG', 0, 0, canvasWidth, canvasHeight);

      const date = new Date(room.updatedAt).toISOString().slice(0, 10);
      pdf.save(`${room.roomName}-${date}.pdf`);

      // Cleanup
      fabricCanvas.dispose();
      toast.success("Downloaded as PDF");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download PDF");
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <>
      {
        loading ?
          <div className=" w-screen h-screen flex justify-center items-center  gap-2">
             <Circles
        height="70"
        width="70"
        color="#fff"
        ariaLabel="circles-loading"
        wrapperStyle={{}}
        wrapperClass=""
        visible={loading}
        /> <div className="text-2xl"> Fetching History!! </div>
          </div>
          :
          <div className="history-page-wrapper">
            <div className="history-container">

              {/* MAIN CONTAINER */}
              <div className="history-content-box">

                {/* Back Button */}
                <button onClick={handleBackToHome} className="history-back-button">
                  <ArrowLeft size={22} />
                  <span>Back to Home</span>
                </button>

                {/* Page Title */}
                <div className="history-header">
                  <h1 className="history-title">History</h1>
                  <p className="history-subtitle">View and manage your whiteboard sessions</p>
                </div>

                <div className="flex gap-4" style={{ padding: "20px 30px" }}>
                  <button
                    className={`relative after:content-[''] after:absolute after:left-0 after:bottom-0  after:h-1 after:bg-purple-700  after:transition-all after:duration-300 after:delay-150  ${createdHistory ? 'after:w-full' : 'after:w-0'} `} style={{ padding: "10px 30px" }}
                    onClick={() => setCreatedHistory(true)}
                  >
                    Created by Me
                  </button>
                  <button
                    className={`relative after:content-[''] after:absolute after:left-0 after:bottom-0  after:h-1 after:bg-purple-700  after:transition-all after:duration-300 after:delay-150  ${!createdHistory ? 'after:w-full' : 'after:w-0'} `} style={{ padding: "10px 30px" }}
                    onClick={() => setCreatedHistory(false)}
                  >
                    Joined by Me
                  </button>
                </div>

                {
                  createdHistory ?
                    <div className="history-cards-container">
                      {historyMine.map((room) => (
                        <div key={room.id} className="history-card">

                          {/* Room Name */}
                          <h2 className="history-room-name">{room.roomName}</h2>

                          {/* Bottom Row */}
                          <div className="history-bottom-row">

                            {/* Created By */}
                            <div className="history-info-box">
                              <User size={18} className="history-icon-user" />
                              <div className="history-info-content">
                                <span className="history-info-label">Created by:</span>
                                <span className="history-info-value">{room.host.fullName}</span>
                              </div>
                            </div>

                            {/* Date */}
                            <div className="history-info-box">
                              <Calendar size={18} className="history-icon-calendar" />
                              <div className="history-info-content">
                                <span className="history-info-label">Date:</span>
                                <span className="history-info-value date">{new Date(room.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* PDF Button */}
                            <button
                          onClick={() => downloadHistoryAsPDF(room)}
                          className="history-download-button"
                          title="Download as PDF"
                        >
                          <Download size={18} /> Board Data
                        </button>

                            {/* Open Button */}
                            <Link
                              to={`/history/${room.roomId}`}
                              className="history-open-button"
                            >
                              <Play size={20} fill="white" />
                              <span>Open</span>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                    :
                    <div className="history-cards-container">
                      {historyJoined.map((room) => (
                        <div key={room.id} className="history-card">

                          {/* Room Name */}
                          <h2 className="history-room-name">{room.roomName}</h2>

                          {/* Bottom Row */}
                          <div className="history-bottom-row">

                            {/* Created By */}
                            <div className="history-info-box">
                              <User size={18} className="history-icon-user" />
                              <div className="history-info-content">
                                <span className="history-info-label">Created by:</span>
                                <span className="history-info-value">{room.host.fullName}</span>
                              </div>
                            </div>

                            {/* Date */}
                            <div className="history-info-box">
                              <Calendar size={18} className="history-icon-calendar" />
                              <div className="history-info-content">
                                <span className="history-info-label">Date:</span>
                                <span className="history-info-value date">{new Date(room.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Open Button */}
                            <Link
                              to={`/history/${room.roomId}`}
                              className="history-open-button"
                            >
                              <Play size={20} fill="white" />

                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                }
                {/* History Cards */}

              </div>
            </div>
          </div>
      }
    </>
  )
}