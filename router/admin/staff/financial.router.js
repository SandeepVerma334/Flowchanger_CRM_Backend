import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { createFinancialDetails, deleteFinancialDetailsById, getAllFinancialDetails, getFinancialDetailsById, updateFinancialDetailsById } from "../../../controller/admin/staff/financialDetails/finanical.controller.js";
const financialRouter = express.Router();

financialRouter.put("/update/:id", authorizationMiddleware, updateFinancialDetailsById);
financialRouter.post("/create", authorizationMiddleware,  createFinancialDetails);
financialRouter.get("/all", authorizationMiddleware, getAllFinancialDetails);
financialRouter.get("/single", authorizationMiddleware, getFinancialDetailsById);
financialRouter.delete("/:id", authorizationMiddleware, deleteFinancialDetailsById);

export default financialRouter