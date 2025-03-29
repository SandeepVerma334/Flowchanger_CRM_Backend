import express from "express";
import errorHandler from "../../middleware/errorhandler.js";
import { authorizationMiddleware } from "../../middleware/auth.js";
import { getMultipleStaffPayroll, getPaymentHistory, getSpecificStaffPayroll } from "../../controller/admin/staff/payroll.controller.js";

const payrollRouter = express.Router();

payrollRouter.get("/singleStaff/:month/:year", authorizationMiddleware, getSpecificStaffPayroll);
payrollRouter.get("/allStaff/:month/:year", authorizationMiddleware, getMultipleStaffPayroll);
payrollRouter.get("/paymentHistory/:staffId", authorizationMiddleware, getPaymentHistory);

payrollRouter.use(errorHandler);

export default payrollRouter;
