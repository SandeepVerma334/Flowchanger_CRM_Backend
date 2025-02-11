import { Router } from "express";
const rootRouter = Router();

import staffRouter from "./admin/staff/staffDetail.router.js";
rootRouter.use("/staff", staffRouter);

export default rootRouter;