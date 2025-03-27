import { config } from "dotenv";
import express from "express";
import cors from "cors";
import rootRouter from "./router/routes.js";
import path from "path";
import { createServer } from "http";
// Load environment variables
config();

const app = express();
const server = createServer(app); // Create HTTP server

const __dirname = path.resolve();
const buildPath = path.join(__dirname, "../frontend-flowchanger.ai/build");
app.use(express.static(buildPath));

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// API Routes
app.use("/api/", rootRouter);


// ✅ Start HTTP & WebSocket server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

});
