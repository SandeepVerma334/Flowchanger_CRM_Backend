import express from "express";
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff  } from "../../../controller/admin/staff/staffDetail.controller.js";
import { authorizationMiddleware } from "../../../middleware/auth.js";
const staffRouter = express.Router();

staffRouter.post("/", authorizationMiddleware, createStaff);
staffRouter.get("/", authorizationMiddleware, getAllStaff);
staffRouter.get("/one", authorizationMiddleware, getStaffById);
staffRouter.put("/:id", authorizationMiddleware, updateStaff);
staffRouter.delete("/:id", authorizationMiddleware, deleteStaff);

export default staffRouter;