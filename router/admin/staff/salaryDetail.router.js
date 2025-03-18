import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { bulkSalaryCreateOrUpdate, createSalary, deleteSalary, getSalaryForAdmin, getSalaryForSingleStaff, getSalaryForStaff, updateSalary } from "../../../controller/admin/staff/salaryDetail.controller.js";
import errorHandler from "../../../middleware/errorhandler.js";

const salaryDetailRouter = express.Router();

salaryDetailRouter.post("/", authorizationMiddleware, createSalary);
salaryDetailRouter.post("/bulk-create", authorizationMiddleware, bulkSalaryCreateOrUpdate);
salaryDetailRouter.get("/forAdmin", authorizationMiddleware, getSalaryForAdmin);
salaryDetailRouter.get("/forStaff", authorizationMiddleware, getSalaryForStaff);
salaryDetailRouter.get("/single/:id", authorizationMiddleware, getSalaryForSingleStaff);
salaryDetailRouter.put("/:id", authorizationMiddleware, updateSalary);
salaryDetailRouter.delete("/:id", authorizationMiddleware, deleteSalary);


salaryDetailRouter.use(errorHandler);

export default salaryDetailRouter;