import express from "express";

import { authorizationMiddleware } from "../../middleware/auth.js";
// import { createProject} from "../../controller/admin/project/project.controller.js";
import { createProject,getAllProjects,getProjectById, deleteProjectById, searchProjectByName, updateProjectById, bulkDeleteProjectById } from "../../controller/admin/project/project.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const projectRouter = express.Router();

projectRouter.post("/", authorizationMiddleware,createProject);
projectRouter.get("/all", authorizationMiddleware, getAllProjects);
projectRouter.get("/single/:id", authorizationMiddleware, getProjectById);
projectRouter.get("/search", authorizationMiddleware, searchProjectByName)
projectRouter.delete("/delete/:id", authorizationMiddleware, deleteProjectById);
projectRouter.delete("/bulk-delete", authorizationMiddleware, bulkDeleteProjectById);
projectRouter.put("/update/:id", authorizationMiddleware, updateProjectById)

projectRouter.use(errorHandler);

export default projectRouter;