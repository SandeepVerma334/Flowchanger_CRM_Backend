import { Router } from "express";
const rootRouter = Router();

import staffRouter from "./admin/staff/staffDetail.router.js";
import superAdminRouter from "./superAdmin/superAdmin.router.js";
import subscriptionRouter from "./superAdmin/subscription.router.js";

rootRouter.use("/staff", staffRouter);
rootRouter.use("/superAdmin", superAdminRouter);
rootRouter.use("/subscription", subscriptionRouter);

export default rootRouter;