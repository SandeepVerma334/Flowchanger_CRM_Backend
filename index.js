import { config } from "dotenv";
import express from "express";
import cors from "cors";
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
