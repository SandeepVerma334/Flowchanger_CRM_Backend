import express from "express";
import {  createAttendance, endAttendanceBreak, getAllAttendance, getAllAttendanceByDate, getAllEndBreakRecord, getAllStartBreakRecord, getAttendanceByMonth, halfDayAttendance, startAttendanceBreak ,countStaffAttendance} from "../../../controller/admin/staff/attendance/attendance.controller.js";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { uploadSingle } from "../../../middleware/multer.middleware.js";
const attendanceRouter = express.Router();

attendanceRouter.post("/create", authorizationMiddleware, createAttendance);
attendanceRouter.get("/all-attendance", authorizationMiddleware, getAllAttendance);
attendanceRouter.get("/attendance-getBy-month/:staffId/:type", authorizationMiddleware, getAttendanceByMonth);
// attendanceRouter.post('/attendance-create-bulk', authorizationMiddleware, createBulkAttendance);
attendanceRouter.get("/all-attendance-by-date", authorizationMiddleware, getAllAttendanceByDate);
attendanceRouter.post("/start-break", authorizationMiddleware, uploadSingle("startBreakImage"), startAttendanceBreak);
attendanceRouter.put("/end-break/:startBreakid", authorizationMiddleware, uploadSingle("endBreakImage"), endAttendanceBreak);
attendanceRouter.get("/all-start-break", authorizationMiddleware, getAllStartBreakRecord);
attendanceRouter.get("/all-end-break", authorizationMiddleware, getAllEndBreakRecord);
attendanceRouter.get("/count/:date", authorizationMiddleware, countStaffAttendance);
attendanceRouter.post("/halfday", authorizationMiddleware, halfDayAttendance);

export default attendanceRouter;
