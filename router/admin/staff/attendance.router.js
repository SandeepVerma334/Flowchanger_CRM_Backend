import express from "express";
import { authorizationMiddleware } from "../../../middleware/auth.js";
import { createAttendance, startAttendanceBreak, endAttendanceBreak, getAllAttendance, getAttendanceByStaffId, updateAttendanceEndTime, getAttendanceByMonth, halfDayAttendance, getAllAttendanceByDate } from "../../../controller/admin/staff/attendance/attendance.controller.js";
import { uploadSingle } from "../../../middleware/multer.middleware.js";
const attendanceRouter = express.Router();

attendanceRouter.post("/create", authorizationMiddleware, createAttendance);
attendanceRouter.get("/all-attendance", authorizationMiddleware, getAllAttendance);
attendanceRouter.get("/single-attendance/:staffId",authorizationMiddleware, getAttendanceByStaffId);
attendanceRouter.put("/end-attendance-time/:id", authorizationMiddleware, updateAttendanceEndTime);
attendanceRouter.get("/attendance-getBy-month/:staffId", authorizationMiddleware, getAttendanceByMonth);
// attendanceRouter.post('/attendance-create-bulk/:staffId', authorizationMiddleware, createBulkAttendance);
attendanceRouter.post("/start-break", authorizationMiddleware, uploadSingle("startBreakImage"), startAttendanceBreak);
attendanceRouter.put("/end-break/:startBreakid", authorizationMiddleware, uploadSingle("endBreakImage"), endAttendanceBreak);
attendanceRouter.get("/all-attendance-by-date", authorizationMiddleware, getAllAttendanceByDate);

// halfday

attendanceRouter.post("/halfday", authorizationMiddleware, halfDayAttendance);

export default attendanceRouter;