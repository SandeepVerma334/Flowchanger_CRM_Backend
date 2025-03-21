import express from "express";
import { createEducationForStaff, getAllStaffEducation, getStaffEducationById,updateStaffEducationById, deleteStaffEducationById, searchStaffEducation } from "../../../controller/admin/staff/educationQulification/education.controller.js";
import { authorizationMiddleware } from "../../../middleware/auth.js";
const educationRouter = express.Router();

educationRouter.post("/create", createEducationForStaff);
educationRouter.get("/all", authorizationMiddleware, getAllStaffEducation);
educationRouter.get("/single/:id", authorizationMiddleware, getStaffEducationById);
educationRouter.delete("/delete/:id", authorizationMiddleware, deleteStaffEducationById);
educationRouter.get("/search", authorizationMiddleware, searchStaffEducation);
educationRouter.put("/update/:id", authorizationMiddleware, updateStaffEducationById);

export default educationRouter;