import express from "express";
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff, bulkCreateStaff, bulkUpdateStaff ,bulkDeleteStaff } from "../../../controller/admin/staff/staffDetail.controller.js";
import { authorizationMiddleware } from "../../../middleware/auth.js";
const staffRouter = express.Router();

staffRouter.post("/", authorizationMiddleware, createStaff);
staffRouter.post("/bulk-create", authorizationMiddleware, bulkCreateStaff);
staffRouter.put("/bulk-update", authorizationMiddleware, bulkUpdateStaff);
staffRouter.get("/", authorizationMiddleware, getAllStaff);
staffRouter.get("/one", authorizationMiddleware, getStaffById);
staffRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteStaff);
staffRouter.put("/:id", authorizationMiddleware, updateStaff);
staffRouter.delete("/:id", authorizationMiddleware, deleteStaff);

export default staffRouter;