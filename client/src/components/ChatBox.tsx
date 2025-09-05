// @ts-nocheck
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const ChatBox = () => {
  const { sessionId } = useParams();
  const [socket, setSocket] = useState(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const s = io("http://localhost:8080", { query: { room: sessionId } });
    setSocket(s);

    s.on("chatMessage", (m) => {
      setMessages((prev) => [...prev, m]);
    });

    return () => s.disconnect();
  }, [sessionId]);

  const sendMessage = () => {
    socket.emit("chatMessage", msg);
    setMessages((prev) => [...prev, msg]);
    setMsg("");
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Chat</h3>
      <input
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
      <ul>
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
};

export default ChatBox;
