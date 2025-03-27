import express from "express";

import { bulkDeleteProjectById, countProjects, createProject, deleteProjectById, getAllProjects, getProjectById, searchProjectByName, updateProjectById } from "../../controller/admin/project/project.controller.js";
import { authorizationMiddleware } from "../../middleware/auth.js";
import errorHandler from "../../middleware/errorhandler.js";

const projectRouter = express.Router();



// Project related api's
projectRouter.post("/", authorizationMiddleware, createProject);
projectRouter.get("/all", authorizationMiddleware, getAllProjects);
projectRouter.get("/single/:id", authorizationMiddleware, getProjectById);
projectRouter.get("/search", authorizationMiddleware, searchProjectByName)
projectRouter.delete("/delete/:id", authorizationMiddleware, deleteProjectById);
projectRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteProjectById);
projectRouter.put("/update/:id", authorizationMiddleware, updateProjectById)
projectRouter.get("/count", authorizationMiddleware, countProjects)

projectRouter.use(errorHandler);

export default projectRouter;