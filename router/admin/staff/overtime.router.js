import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { addOvertimeData, getOvertimeAll, getOvertimeById, deleteOvertimeById, bulkDeleteOvertimeById } from "../../../controller/admin/staff/attendance/overtime.controller.js";
const overtimeRouter = express.Router();

overtimeRouter.post("/create", authorizationMiddleware, addOvertimeData);
overtimeRouter.get("/all", authorizationMiddleware, getOvertimeAll);
overtimeRouter.get("/single/:id", authorizationMiddleware, getOvertimeById);
overtimeRouter.delete("/delete/:id", authorizationMiddleware, deleteOvertimeById);
overtimeRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteOvertimeById);

export default overtimeRouter;