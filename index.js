import { config } from "dotenv";
import express from "express";
import cors from "cors";
import rootRouter from "./router/routes.js";
import jwt from "jsonwebtoken";
import path from "path";
import { createServer } from "http";
// Load environment variables
import cron from "node-cron";
import autoCreateAttendance from "./utils/autoAttendanceMarkAdminsStaff.js";

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
app.use("/api/", rootRouter);
setTimeout(() => {
  console.log("⏳ Scheduling Attendance Marking...");
  autoCreateAttendance();
}, 10000); // 10 seconds delay
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
});
