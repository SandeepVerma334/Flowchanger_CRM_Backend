import express from "express";
import { createStaff } from "../../../controller/admin/staff/staffDetail.controller.js";

const staffRouter = express.Router();

staffRouter.post("/createStaff", createStaff);

export default staffRouter;
