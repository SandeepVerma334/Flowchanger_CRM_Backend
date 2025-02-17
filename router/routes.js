import { Router } from "express";
const rootRouter = Router();

import staffRouter from "./admin/staff/staffDetail.router.js";
import superAdminRouter from "./superAdmin/superAdmin.router.js";

rootRouter.use("/staff", staffRouter);
rootRouter.use("/superAdmin", superAdminRouter);

export default rootRouter;