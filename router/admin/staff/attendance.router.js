import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import {  startAttendanceBreak, endAttendanceBreak, getAllAttendance, getAttendanceByStaffId, createAttendance, getAttendanceByMonth, halfDayAttendance, getAllAttendanceByDate, getAllEndBreakRecord, getAllStartBreakRecord } from "../../../controller/admin/staff/attendance/attendance.controller.js";
import { uploadSingle } from "../../../middleware/multer.middleware.js";
const attendanceRouter = express.Router();

attendanceRouter.post("/create", authorizationMiddleware, createAttendance);
attendanceRouter.get("/single-attendance/:staffId", authorizationMiddleware, getAttendanceByStaffId);
attendanceRouter.get("/all-attendance", authorizationMiddleware, getAllAttendance);
attendanceRouter.get("/attendance-getBy-month/:staffId", authorizationMiddleware, getAttendanceByMonth);
attendanceRouter.get("/all-attendance-by-date", authorizationMiddleware, getAllAttendanceByDate);
attendanceRouter.post("/start-break", authorizationMiddleware, uploadSingle("startBreakImage"), startAttendanceBreak);
attendanceRouter.put("/end-break/:startBreakid", authorizationMiddleware, uploadSingle("endBreakImage"), endAttendanceBreak);
attendanceRouter.get("/all-start-break", authorizationMiddleware, getAllStartBreakRecord);
attendanceRouter.get("/all-end-break", authorizationMiddleware, getAllEndBreakRecord);

attendanceRouter.post("/halfday", authorizationMiddleware, halfDayAttendance);

export default attendanceRouter;