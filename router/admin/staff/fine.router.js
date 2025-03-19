import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { addFineData } from "../../../controller/admin/staff/attendance/fine.controller.js";
const fineRouter = express.Router();

fineRouter.post("/create", authorizationMiddleware, addFineData);

export default fineRouter;