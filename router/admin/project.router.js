import express from "express";

import { authorizationMiddleware } from "../../middleware/auth.js";
// import { createProject} from "../../controller/admin/project/project.controller.js";
import { createProject } from "../../controller/admin/project/project.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const projectRouter = express.Router();

projectRouter.post("/", createProject);

projectRouter.use(errorHandler);

export default projectRouter;