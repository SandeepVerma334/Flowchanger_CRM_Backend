import { Router } from "express";
const taskRouter = Router();
import { authorizationMiddleware } from "../../middleware/auth.js";
import { createTask, getAllTasks, updateTask, bulkDeleteTasks, getTaskById, deletetaskById, searchTasks } from "../../controller/admin/task/task.controller.js";

taskRouter.post("/create", authorizationMiddleware, createTask);
taskRouter.get("/all-task", authorizationMiddleware, getAllTasks);
taskRouter.put("/update/:taskId", authorizationMiddleware, updateTask);
taskRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteTasks);
taskRouter.get("/get-single/:taskId", authorizationMiddleware, getTaskById);
taskRouter.delete("/delete/:taskId", authorizationMiddleware, deletetaskById);
taskRouter.get("/search", authorizationMiddleware, searchTasks);

export default taskRouter;
