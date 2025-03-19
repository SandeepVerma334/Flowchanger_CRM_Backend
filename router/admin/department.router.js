import { Router } from "express";
const departmentRouter = Router();

import { authorizationMiddleware } from "../../middleware/auth.js";
import { bulkDeleteDepartments, countDepartments, createDepartment, deleteDepartment, getAllDepartments, searchDepartment, updateDepartment } from "../../controller/admin/department.controller.js";

departmentRouter.post("/", authorizationMiddleware, createDepartment);
departmentRouter.get("/", authorizationMiddleware, getAllDepartments);
departmentRouter.get("/search", authorizationMiddleware, searchDepartment);
departmentRouter.get("/count", authorizationMiddleware, countDepartments);
departmentRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteDepartments);
departmentRouter.put("/:id", authorizationMiddleware, updateDepartment);
departmentRouter.delete("/:id", authorizationMiddleware, deleteDepartment);


export default departmentRouter;