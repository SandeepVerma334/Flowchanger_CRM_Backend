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
import noteRouter from "./admin/note.router.js";
import discussionRouter from "./admin/discusstion.router.js";
import reportRouter from "./admin/report.router.js";
import educationRouter from "./admin/staff/education.router.js"
import financialRouter from "./admin/staff/financial.router.js"
import attendanceRouter from "./admin/staff/attendance.router.js"
import salaryDetailRouter from "./admin/staff/salaryDetail.router.js";
import overtimeRouter from "./admin/staff/overtime.router.js"
import fineRouter from "./admin/staff/fine.router.js"
import bankDetailsRouter from "./admin/staff/bankDetails.router.js"
import payrollRouter from "./admin/payroll.router.js";

rootRouter.use("/branch", branchRouter);
rootRouter.use("/department", departmentRouter);
rootRouter.use("/staff", staffRouter);
rootRouter.use("/superAdmin", superAdminRouter);
rootRouter.use("/transaction", transactionRouter);
rootRouter.use("/package", packageRouter);
rootRouter.use("/subscription", subscriptionRouter);
rootRouter.use("/admin", adminSignup);
rootRouter.use("/client", clientRouter);
rootRouter.use("/note", noteRouter);
rootRouter.use("/discussion", discussionRouter);
rootRouter.use("/report", reportRouter);
rootRouter.use("/role", roleRouter);
rootRouter.use("/task", taskRouter);
rootRouter.use("/project", projectRouter);
rootRouter.use("/education", educationRouter);
rootRouter.use("/financial", financialRouter);
rootRouter.use("/attendance", attendanceRouter);
rootRouter.use("/salary", salaryDetailRouter);
rootRouter.use("/overtime", overtimeRouter);
rootRouter.use("/fine", fineRouter);
rootRouter.use("/bank-details", bankDetailsRouter);
rootRouter.use("/payroll", payrollRouter);

export default rootRouter;