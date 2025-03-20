import express from "express";
import errorHandler from "../../middleware/errorhandler.js";
import { authorizationMiddleware } from "../../middleware/auth.js";
import { getSpecificStaffPayroll } from "../../controller/admin/staff/payroll.controller.js";

const payrollRouter = express.Router();

payrollRouter.get("/singleStaff/:staffId/:month/:year", authorizationMiddleware, getSpecificStaffPayroll);

payrollRouter.use(errorHandler);

export default payrollRouter;
