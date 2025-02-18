import { config } from "dotenv";
import express from "express";
// import http from "http";
import cors from "cors";
// import socketIo from "socket.io";
import rootRouter from "./router/routes.js";
import jwt from "jsonwebtoken";
import path from "path";


config();

const app = express();
const _dirname = path.dirname("")
const buildpath = path.join(_dirname, "../frontend-flowchanger.ai/build")
app.use(express.static(buildpath))

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/api/", rootRouter);

// const server = http.createServer(app);

// const io = socketIo(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//   },
// });

// io.on("connection", (socket) => {
//   console.log("New client connected:", socket.id);

//   socket.on("setup", ({ token }) => {
//     try {
//       const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//       const id = decodedToken.userId;
//       console.log("id:", id);
//       socket.join(id);
//     } catch (error) {
//       console.log(error);
//     }
//   });

//   socket.on("join_room", (roomId) => {
//     console.log("User joined room:", roomId);
//     socket.join(roomId);
//   });

//   socket.on("send_message", (data) => {
//     console.log("receive_message", data);
//     const { room, users, message } = data;
//     users.forEach((user) => {
//       if (user.id !== message.sender.id) {
//         console.log(user.id);
//         socket.in(user.id).emit("message_received", message);
//       }
//     });
//   });

//   socket.on("message", (data) => {
//     console.log("Received message:", data);
//     io.emit("message", data);
//   });

//   socket.on("disconnect", () => {
//     console.log("Client disconnected:", socket.id);
//   });
// });

// server.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
