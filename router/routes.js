import { Router } from "express";
const rootRouter = Router();

import adminSignup from "./admin/admin.router.js";
import branchRouter from "./admin/branch.router.js";
import departmentRouter from "./admin/department.router.js";
import packageRouter from "./admin/package.router.js";
import staffRouter from "./admin/staff/staffDetail.router.js";
import subscriptionRouter from "./superAdmin/subscription.router.js";
import superAdminRouter from "./superAdmin/superAdmin.router.js";
import transactionRouter from "./superAdmin/transaction.router.js";
import clientRouter from "./client/client.router.js";
import roleRouter from "./admin/role.router.js";
import projectRouter from "./admin/project.router.js";
import taskRouter from "./admin/task.router.js";

rootRouter.use("/branch", branchRouter);
rootRouter.use("/department", departmentRouter);
rootRouter.use("/staff", staffRouter);
rootRouter.use("/superAdmin", superAdminRouter);
rootRouter.use("/transaction", transactionRouter);
rootRouter.use("/package", packageRouter);
rootRouter.use("/subscription", subscriptionRouter);
rootRouter.use("/admin", adminSignup);
rootRouter.use("/client", clientRouter);
rootRouter.use("/role", roleRouter);
rootRouter.use("/project", projectRouter);
rootRouter.use("/task", taskRouter);
export default rootRouter;