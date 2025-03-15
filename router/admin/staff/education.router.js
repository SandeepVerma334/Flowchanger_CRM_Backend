import express from "express";
import { createEducationForStaff, getAllStaffEducation, getStaffEducationById, deleteStaffEducationById, searchStaffEducation } from "../../../controller/admin/staff/educationQulification/education.controller.js";
import { authorizationMiddleware } from "../../../middleware/auth.js";
const educationRouter = express.Router();

educationRouter.post("/create", createEducationForStaff);
educationRouter.get("/all", authorizationMiddleware, getAllStaffEducation);
educationRouter.get("/single/:id", authorizationMiddleware, getStaffEducationById);
educationRouter.delete("/delete/:id", authorizationMiddleware, deleteStaffEducationById);
educationRouter.get("/search", authorizationMiddleware, searchStaffEducation);

export default educationRouter;