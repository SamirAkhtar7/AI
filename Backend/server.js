import "dotenv/config";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";
import generateAIContent from "./services/genai.service.js";  


const port = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

     const projectId = socket.handshake.query.projectId;

    console.log("Token:", token); // Debugging
    console.log("Project ID:", projectId); // Debugging

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Authentication error: Invalid project ID"));
    }

    socket.Project = await projectModel.findById(projectId).lean();
    if (!token) {
      return next(new Error("Authentication error: Missing token"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error("Authentication error: Invalid token"));
    }

    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Socket authentication error:", err.message); // Debugging
    next(err);
  }
});

io.on("connection", (socket) => {
 socket.roomId = socket.Project._id.toString()
  console.log("A user connected to project:", socket.roomId);

  socket.join(socket.roomId);

  socket.on("project-message",async (data) => {

    const message = data.message;
    const aiIsPresentInMessage = message.includes('@ai');
    if (aiIsPresentInMessage) {
      console.log("Received AI-message:"); // Debugging
      const prompt = message.replace('@ai',"")
      const result = await generateAIContent(prompt)

      io.to(socket.roomId).emit("project-message", {
        message:result,
        sender: {
          _id: 'ai',
          name:'AI'
        }
       
      });
      return;
    }


    console.log("Received project-message:", data); // Debugging
    socket.broadcast.to(socket.roomId).emit("project-message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected from project:", socket.Project._id);
    socket.leave(socket.roomsId)
  });

  // socket.on("event", (data) => {
  //   /* … */
  // });
  // socket.on("disconnect", () => {
  //   /* … */
  // });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
