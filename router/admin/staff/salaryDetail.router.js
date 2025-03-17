import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { createSalary, deleteSalary, getSalaries, updateSalary } from "../../../controller/admin/staff/salaryDetail.controller.js";
import errorHandler from "../../../middleware/errorhandler.js";

const salaryDetailRouter = express.Router();

salaryDetailRouter.post("/", authorizationMiddleware, createSalary);
salaryDetailRouter.get("/", authorizationMiddleware, getSalaries);
salaryDetailRouter.put("/:id", authorizationMiddleware, updateSalary);
salaryDetailRouter.delete("/:id", authorizationMiddleware, deleteSalary);


salaryDetailRouter.use(errorHandler);

export default salaryDetailRouter;