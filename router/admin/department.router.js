import { Router } from "express";
const departmentRouter = Router();

import { createDepartment, getAllDepartments, updateDepartment, deleteDepartment, deleteDepartmentsInBulk, showDepartment, searchDepartmentByName } from "../../controller/admin/department.controller.js";
import { authorizationMiddleware } from "../../middleware/auth.js";

departmentRouter.post("/", authorizationMiddleware, createDepartment);
departmentRouter.get("/", authorizationMiddleware, getAllDepartments);
departmentRouter.put("/:id", authorizationMiddleware, updateDepartment);
departmentRouter.delete("/bulk-delete", authorizationMiddleware, deleteDepartmentsInBulk);
departmentRouter.delete("/:id", authorizationMiddleware, deleteDepartment);
departmentRouter.get("/:id", authorizationMiddleware, showDepartment);
departmentRouter.get("/search", authorizationMiddleware, searchDepartmentByName);

export default departmentRouter;