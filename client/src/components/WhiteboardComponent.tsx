// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const WhiteboardComponent = () => {
  const { sessionId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [color, setColor] = useState("#000000");
  const [thickness, setThickness] = useState(2);

  // history for undo
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // ------------------ SOCKET + CANVAS SETUP ------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 80; // leave space for toolbar
    const context = canvas.getContext("2d");
    if (!context) return;
    context.lineCap = "round";
    setCtx(context);

    // Connect to backend
    const s = io("https://collab-board-4ax9.onrender.com", {
      transports: ["websocket"],
      withCredentials: false,
    });

    s.emit("join-room", sessionId);
    setSocket(s);

    // Listen for updates from other users
    s.on("onpropogate", (data: any) => {
      if (!context) return;

      switch (data.type) {
        case "draw":
          context.strokeStyle = data.color;
          context.lineWidth = data.thickness;
          context.lineTo(data.x, data.y);
          context.stroke();
          break;
        case "down":
          context.beginPath();
          context.moveTo(data.x, data.y);
          break;
        case "clear":
          context.clearRect(0, 0, canvas.width, canvas.height);
          break;
        default:
          break;
      }
    });

    // Handle window resize
    const handleResize = () => {
      const imgData = context.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 80;
      context.putImageData(imgData, 0, 0);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      s.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [sessionId]);

  // ------------------ STATE SAVE ------------------
  const saveState = () => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(data);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // ------------------ DRAWING LOGIC ------------------
  const startDrawing = (x: number, y: number) => {
    if (!ctx || !socket) return;
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

  const draw = (x: number, y: number) => {
    if (!ctx || !socket) return;
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
    if (!ctx || !socket || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    socket.emit("propogate", { roomId: sessionId, type: "clear" });
    saveState();
  };

  const handleUndo = () => {
    if (historyStep > 0 && ctx && canvasRef.current) {
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
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `collab-board-${sessionId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // ------------------ MOUSE & TOUCH HANDLERS ------------------
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDrawing(true);
    const { offsetX, offsetY } = e.nativeEvent;
    startDrawing(offsetX, offsetY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    draw(offsetX, offsetY);
  };
  const handleMouseUp = () => setIsDrawing(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    draw(touch.clientX - rect.left, touch.clientY - rect.top);
  };
  const handleTouchEnd = () => setIsDrawing(false);

  // ------------------ JSX ------------------
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

      {/* Canvas */}
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
