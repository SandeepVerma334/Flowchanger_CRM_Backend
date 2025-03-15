import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { createFinancialDetails, getAllFinancialDetails } from "../../../controller/admin/staff/financialDetails/finanical.controller.js";
const financialRouter = express.Router();

financialRouter.post("/create", authorizationMiddleware,  createFinancialDetails);
financialRouter.get("/all", authorizationMiddleware, getAllFinancialDetails);

export default financialRouter