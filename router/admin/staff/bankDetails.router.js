import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { addBankDetails, getBankDetails, deleteBankDetailsById, getBankDetailsById, updateBankDetailsById, searchBankDetails, getAllBankDetails } from "../../../controller/admin/staff/bankDetails.controller.js";
const bankDetailsRouter = express.Router();

bankDetailsRouter.get("/all", authorizationMiddleware, getAllBankDetails);
bankDetailsRouter.post("/create", authorizationMiddleware, addBankDetails);
bankDetailsRouter.get("/all", authorizationMiddleware, getBankDetails);
bankDetailsRouter.get("/single/:staffId", authorizationMiddleware, getBankDetailsById);
bankDetailsRouter.put("/update/:id", authorizationMiddleware, updateBankDetailsById);
bankDetailsRouter.delete("/delete/:id", authorizationMiddleware, deleteBankDetailsById);
bankDetailsRouter.get("/search", authorizationMiddleware, searchBankDetails);

export default bankDetailsRouter;