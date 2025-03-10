import express from "express";
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff, searchStaff } from "../../../controller/admin/staff/staffDetail.controller.js";
import { authorizationMiddleware } from "../../../middleware/auth.js";
const staffRouter = express.Router();

staffRouter.post("/", authorizationMiddleware, createStaff);
staffRouter.get("/", authorizationMiddleware, getAllStaff);
staffRouter.get("/one", authorizationMiddleware, getStaffById);
staffRouter.put("/:id", authorizationMiddleware, updateStaff);
staffRouter.delete("/:id", authorizationMiddleware, deleteStaff);
staffRouter.get("/search", authorizationMiddleware, searchStaff);

export default staffRouter;