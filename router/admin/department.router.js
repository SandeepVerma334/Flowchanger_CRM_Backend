import { Router } from "express";
const departmentRouter = Router();

import { createDepartment, getAllDepartments } from "../../controller/admin/department.controller.js";

departmentRouter.post("/", createDepartment);
departmentRouter.get("/", getAllDepartments);

export default departmentRouter;