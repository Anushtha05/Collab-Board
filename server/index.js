let express = require("express");
let app = express();
let httpServer = require("http").createServer(app);
let io = require("socket.io")(httpServer, {
  cors: { origin: "*" } // allow frontend
});

io.on("connection", (socket) => {
  console.log(`${socket.id} connected`);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);
  });

  socket.on("propogate", ({ roomId, ...data }) => {
    socket.to(roomId).emit("onpropogate", data);
  });

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`);
  });
});

let PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
