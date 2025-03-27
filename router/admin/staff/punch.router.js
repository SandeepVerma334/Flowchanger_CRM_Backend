import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { punchInStaff, punchOutStaff, getPunchRecords } from "../../../controller/admin/staff/punch.controller.js";
import { uploadSingle, uploadMultipleFields } from "../../../middleware/multer.middleware.js";
const punchRouter = express.Router();

punchRouter.post("/in", authorizationMiddleware, uploadSingle("punchInPhoto"), punchInStaff);
punchRouter.post("/out", authorizationMiddleware, uploadMultipleFields([{ name: "punchOutPhoto" }]), punchOutStaff);
punchRouter.get("/record/:date", authorizationMiddleware, getPunchRecords);

export default punchRouter;