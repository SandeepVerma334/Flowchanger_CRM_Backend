import express from "express";
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff  } from "../../../controller/admin/staff/staffDetail.controller.js";
const staffRouter = express.Router();

staffRouter.post("/createStaff", createStaff);
staffRouter.get("/", getAllStaff);
staffRouter.get("/one", getStaffById);
staffRouter.put("/:id", updateStaff);
staffRouter.delete("/:id", deleteStaff);

export default staffRouter;