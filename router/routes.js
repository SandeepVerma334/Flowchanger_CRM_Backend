import { Router } from "express";
const rootRouter = Router();

import branchRouter from "./admin/branch.router.js";
import departmentRouter from "./admin/department.router.js";

rootRouter.use("/branch", branchRouter);
rootRouter.use("/department", departmentRouter);

export default rootRouter;