import express from "express";
import { createTransaction, getAllTransactions, getTransactionByAdminId, searchTransaction } from "../../controller/SuperAdmin/transction.controller.js";
import errorHandler from "../../middleware/errorhandler.js";
const transactionRouter = express.Router();

transactionRouter.get("/search", searchTransaction);
transactionRouter.post("/", createTransaction);
transactionRouter.get("/",getAllTransactions );
transactionRouter.get("/:id", getTransactionByAdminId);

transactionRouter.use(errorHandler);

export default transactionRouter;
