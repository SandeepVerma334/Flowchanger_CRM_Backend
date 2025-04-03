import express from "express";

import errorHandler from "../../middleware/errorhandler.js";
import { authorizationMiddleware } from "../../middleware/auth.js";
import { createReport, deleteReport, getAllReports, getReportById, searchReports, updateReport } from "../../controller/admin/report.controller.js";

const reportRouter = express.Router();

reportRouter.post("/", createReport);
reportRouter.get("/", getAllReports);
reportRouter.get("/search", searchReports);
reportRouter.get("/:id", getReportById);
reportRouter.put("/:id", updateReport);
reportRouter.delete("/:id", deleteReport)


reportRouter.use(errorHandler);

export default reportRouter;