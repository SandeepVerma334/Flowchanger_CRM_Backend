import express from "express";
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff, bulkCreateStaff, bulkUpdateStaff, bulkDeleteStaff, searchStaff } from "../../../controller/admin/staff/staffDetail.controller.js";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { uploadMultipleFields, uploadSingle } from "../../../middleware/multer.middleware.js";
const staffRouter = express.Router();

staffRouter.post("/create", authorizationMiddleware, uploadSingle("profileImage"), createStaff);
staffRouter.post("/bulk-create", authorizationMiddleware, bulkCreateStaff);
staffRouter.put("/bulk-update", authorizationMiddleware, bulkUpdateStaff);
staffRouter.get("/all", authorizationMiddleware, getAllStaff);
staffRouter.get("/one", authorizationMiddleware, getStaffById);
staffRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteStaff);
staffRouter.put("/:id", authorizationMiddleware, uploadMultipleFields([{ name: "profileImage" }, { name: "offerLetter" }, { name: "birthCertificate" }, { name: "guarantorForm" }, { name: "degreeCertificate" }]), updateStaff);
staffRouter.delete("/:id", authorizationMiddleware, deleteStaff);
staffRouter.get("/search", authorizationMiddleware, searchStaff);

export default staffRouter;