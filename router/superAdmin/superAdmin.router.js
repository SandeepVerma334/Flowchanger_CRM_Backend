import express from "express";
import { superAdminLogin, createSuperAdmin } from "../../controller/SuperAdmin/SuperAdmin.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const superAdminRouter = express.Router();

superAdminRouter.post("/create", createSuperAdmin)
superAdminRouter.post("/login", superAdminLogin)

superAdminRouter.use(errorHandler);

export default superAdminRouter;