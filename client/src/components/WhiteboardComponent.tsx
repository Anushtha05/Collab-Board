// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const WhiteboardComponent = () => {
  const { sessionId } = useParams();
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [color, setColor] = useState("#000000");
  const [thickness, setThickness] = useState(2);

  // history for undo
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80; // leave space for toolbar
    const context = canvas.getContext("2d");
    context.lineCap = "round";
    setCtx(context);

    const s = io("https://collab-board-4ax9.onrender.com", {
      transports: ["websocket"],
      withCredentials: false,
    });

  });

    s.emit("join-room", sessionId);
    setSocket(s);

    s.on("onpropogate", (data) => {
      if (data.type === "draw") {
        context.strokeStyle = data.color;
        context.lineWidth = data.thickness;
        context.lineTo(data.x, data.y);
        context.stroke();
      }
      if (data.type === "down") {
        context.beginPath();
        context.moveTo(data.x, data.y);
      }
      if (data.type === "clear") {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    window.addEventListener("resize", () => {
      const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80;
      context.putImageData(imgData, 0, 0);
    });

    return () => s.disconnect();
  }, [sessionId]);

  const saveState = () => {
    if (!ctx) return;
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // ===== Mouse Handlers =====
  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    startDrawing(offsetX, offsetY);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    draw(offsetX, offsetY);
  };

  const handleMouseUp = () => setIsDrawing(false);

  // ===== Touch Handlers =====
  const handleTouchStart = (e) => {
    e.preventDefault();
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    startDrawing(x, y);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    draw(x, y);
  };

  const handleTouchEnd = () => setIsDrawing(false);

  // ===== Common Drawing Logic =====
  const startDrawing = (x, y) => {
    ctx.beginPath();
    ctx.moveTo(x, y);

    socket.emit("propogate", {
      roomId: sessionId,
      type: "down",
      x,
      y,
    });

    saveState();
  };

  const draw = (x, y) => {
    ctx.lineTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.stroke();

    socket.emit("propogate", {
      roomId: sessionId,
      type: "draw",
      x,
      y,
      color,
      thickness,
    });
  };

  const handleClear = () => {
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit("propogate", { roomId: sessionId, type: "clear" });
    saveState();
  };

  const handleUndo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const img = new Image();
      img.src = history[historyStep - 1];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      setHistoryStep(historyStep - 1);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `collab-board-${sessionId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 20px",
          background: "#222",
          color: "white",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        <h1 style={{ margin: "0 auto", fontFamily: "'Pacifico', cursive" }}>
          Collab-Board
        </h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <select
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
          >
            <option value={2}>Thin</option>
            <option value={5}>Medium</option>
            <option value={10}>Thick</option>
          </select>
          <button onClick={handleUndo}>Undo</button>
          <button onClick={handleClear}>Reset</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>

      {/* Whiteboard */}
      <canvas
        ref={canvasRef}
        style={{ display: "block", background: "white", touchAction: "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
};

export default WhiteboardComponent;
