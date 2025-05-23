import express from "express";
import { superAdminLogin, createSuperAdmin, sendInviteToAdmin, superAdminPasswordResetLink,superAdminResetPassword } from "../../controller/SuperAdmin/superAdmin.controller.js";
import errorHandler from "../../middleware/errorhandler.js";

const superAdminRouter = express.Router();

superAdminRouter.post("/create", createSuperAdmin)
superAdminRouter.post("/login", superAdminLogin)
superAdminRouter.post("/invite", sendInviteToAdmin)
superAdminRouter.post("/forgot", superAdminPasswordResetLink)
superAdminRouter.patch("/reset", superAdminResetPassword)

superAdminRouter.use(errorHandler);

export default superAdminRouter;
