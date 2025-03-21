import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { uploadSingle } from "../../../middleware/multer.middleware.js";
import { createAttendance, createBulkAttendance, endAttendanceBreak, getAllAttendance, getAllAttendanceByDate, getAllEndBreakRecord, getAllStartBreakRecord, getAttendanceByMonth, getAttendanceByStaffId, halfDayAttendance, startAttendanceBreak, updateAttendanceEndTime } from "../../../controller/admin/staff/attendance/attendance.controller.js";
const attendanceRouter = express.Router();

attendanceRouter.post("/create", authorizationMiddleware, createAttendance);
attendanceRouter.get("/all-attendance", authorizationMiddleware, getAllAttendance);
attendanceRouter.get("/single-attendance/:staffId", authorizationMiddleware, getAttendanceByStaffId);
attendanceRouter.put("/end-attendance-time/:id", authorizationMiddleware, updateAttendanceEndTime);
attendanceRouter.get("/attendance-getBy-month/:staffId", authorizationMiddleware, getAttendanceByMonth);
attendanceRouter.post('/attendance-create-bulk', authorizationMiddleware, createBulkAttendance);
attendanceRouter.get("/all-attendance-by-date", authorizationMiddleware, getAllAttendanceByDate);
attendanceRouter.post("/start-break", authorizationMiddleware, uploadSingle("startBreakImage"), startAttendanceBreak);
attendanceRouter.put("/end-break/:startBreakid", authorizationMiddleware, uploadSingle("endBreakImage"), endAttendanceBreak);
attendanceRouter.get("/all-start-break", authorizationMiddleware, getAllStartBreakRecord);
attendanceRouter.get("/all-end-break", authorizationMiddleware, getAllEndBreakRecord);

// halfday

attendanceRouter.post("/halfday", authorizationMiddleware, halfDayAttendance);

export default attendanceRouter;