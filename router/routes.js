import { Router } from "express";
const rootRouter = Router();

import branchRouter from "./admin/branch.router.js";
import departmentRouter from "./admin/department.router.js";
import staffRouter from "./admin/staff/staffDetail.router.js";
import superAdminRouter from "./superAdmin/superAdmin.router.js";
import transactionRouter from "./superAdmin/transaction.router.js";

rootRouter.use("/branch", branchRouter);
rootRouter.use("/department", departmentRouter);
rootRouter.use("/staff", staffRouter);
rootRouter.use("/superAdmin", superAdminRouter);
rootRouter.use("/transaction", transactionRouter);

export default rootRouter;