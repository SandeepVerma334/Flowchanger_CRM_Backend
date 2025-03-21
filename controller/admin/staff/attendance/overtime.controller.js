// import {OverTimeSchema, AttendanceSchema, AttendanceBreakRecordSchema } from "../../../../utils/validation.js";
import { OverTimeSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";

const addOvertimeData = async (req, res, next) => {
    const admin = await checkAdmin(req.userId, "ADMIN", res);
    if (admin.error) {
        return res.status(400).json({
            message: admin.message
        });
    }
    const {
        staffId,
        attendanceStaffId,
        earlyCommingEntryHoursTime,
        lateOutOvertimeHoursTime,
        earlyCommingEntryAmount,
        earlyEntryAmount,
        lateOutOvertimeAmount,
        lateOutAmount,
        totalAmount,
    } = req.body;

    // Validate input data using Zod schema
    const validation = OverTimeSchema.safeParse({
        staffId,
        earlyCommingEntryAmount,
        earlyEntryAmount,
        lateOutOvertimeAmount,
        lateOutAmount,
        totalAmount,
    });

    if (!validation.success) {
        return res.status(400).json({ message: validation.error.issues[0].message });
    }

    // Ensure attendanceStaffId is provided
    if (!attendanceStaffId) {
        return res.status(400).json({ message: "attendanceStaffId is required to record overtime." });
    }

    try {
        // Check if the attendanceStaffId exists in the database
        const staffAttendance = await prisma.attendanceStaff.findFirst({
            where: { id: attendanceStaffId, adminId: admin.user.adminDetails.id },
        });
        console.log(admin.user.adminDetails.id);
        if (!staffAttendance) {
            return res.status(404).json({ message: "Attendance record not found for the given attendanceStaffId." });
        }

        // Fetch salary details for the employee
        const salaryDetailsData = await prisma.salaryDetail.findFirst({
            where: { staffId: staffAttendance.staffId, adminId: req.userId },
        });
        console.log("salaryDetailsData", salaryDetailsData);
        if (!salaryDetailsData) {
            return res.status(404).json({ message: "Salary details not found for the given staffId." });
        }

        const ctcAmount = salaryDetailsData.ctcAmount; // Total salary amount

        // Calculate per day, per hour, and per minute salary
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyCtc = ctcAmount / daysInMonth;
        const workingHoursPerDay = 8;
        const perHourSalary = dailyCtc / workingHoursPerDay;
        const perMinuteSalary = perHourSalary / 60;
        // Convert early and late overtime hours to minutes
        const earlyCommingMinutes = parseInt(earlyCommingEntryHoursTime) || 0;
        const lateOutMinutes = parseInt(lateOutOvertimeHoursTime) || 0;

        // Apply overtime multipliers
        const earlyCommingOvertime = earlyCommingMinutes * perMinuteSalary * earlyCommingEntryAmount;
        const lateOutOvertime = lateOutMinutes * perMinuteSalary * lateOutOvertimeAmount;

        // Calculate total overtime amount
        const calculatedTotalOvertime = earlyCommingOvertime + lateOutOvertime;

        // Check if an overtime record already exists for the given attendanceStaffId
        const existingOvertime = await prisma.overtime.findFirst({
            where: { attendanceStaffId },
        });

        if (existingOvertime) {
            // Update the existing overtime record
            const overtime = await prisma.overtime.update({
                where: { id: existingOvertime.id },
                data: {
                    earlyCommingEntryAmount,
                    earlyCommingEntryHoursTime,
                    lateOutOvertimeHoursTime,
                    earlyEntryAmount,
                    lateOutOvertimeAmount,
                    lateOutAmount,
                    totalAmount: calculatedTotalOvertime,
                    salaryDetailId: salaryDetailsData.id,
                    adminId: admin.user.adminDetails.id,
                },
            });

            return res.status(200).json({ message: "Overtime updated successfully", overtime });
        }

        // If no overtime record exists, create a new one
        const overtime = await prisma.overtime.create({
            data: {
                staffId,
                attendanceStaffId,
                earlyCommingEntryHoursTime,
                lateOutOvertimeHoursTime,
                earlyCommingEntryAmount,
                earlyEntryAmount,
                lateOutOvertimeAmount,
                lateOutAmount,
                totalAmount: calculatedTotalOvertime,
                salaryDetailId: salaryDetailsData.id,
                adminId: admin.user.adminDetails.id,
            },
        });

        return res.status(201).json({ message: "Overtime created successfully", overtime });
    } catch (error) {
        next(error);
    }
};

// get all overtime data
const getOvertimeAll = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { page, limit } = req.query;
        const overtimeData = await pagination(
            prisma.overtime, {
            page, limit,
            where: {
                adminId: admin.user.adminDetails.id
            },
            include: {
                // include: {
                staff: {
                    include: {
                        User: true,
                    },
                },
                AttendanceStaff: true,
                // },
            }
        }
        );
        res.status(200).json({ message: "Overtime records retrieved successfully", data: overtimeData });
    } catch (error) {
        next(error);
    }
};

// get by id overtime data
const getOvertimeById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { id } = req.params;
        const overtimeData = await prisma.overtime.findUnique({ where: { id } });
        res.status(200).json({ message: "Overtime record retrieved successfully", data: overtimeData });
    } catch (error) {
        next(error);
    }
};

// delete by id overtime data
const deleteOvertimeById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { id } = req.params;
        const overtimeData = await prisma.overtime.delete({ where: { id } });
        res.status(200).json({ message: "Overtime record deleted successfully", data: overtimeData });
    } catch (error) {
        next(error);
    }
};

// delete bulk overtime data
const bulkDeleteOvertimeById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide a valid array of overtime IDs to delete." });
        }

        if (!ids.every(id => typeof id === "string" || typeof id === "number")) {
            return res.status(400).json({ message: "Invalid ID format detected in the request." });
        }

        const overtimeData = await prisma.overtime.deleteMany({
            where: { id: { in: ids } },
        });

        if (overtimeData.count === 0) {
            return res.status(404).json({ message: "No overtime records found for the given IDs." });
        }

        res.status(200).json({
            message: "Overtime records deleted successfully",
            deletedCount: overtimeData.count,
        });
    } catch (error) {
        next(error);
    }
};

// update overtime by id
const updateOvertimeById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { id } = req.params;
        const validation = OverTimeSchema.parse(req.body);
        const overtime = await prisma.overtime.update({
            where: { id, adminId: req.userId },
            data: validation.data,
        });
        res.status(200).json({ message: "Overtime updated successfully", overtime });
    } catch (error) {
        next(error);
    }
};


export { addOvertimeData, getOvertimeAll, getOvertimeById, deleteOvertimeById, bulkDeleteOvertimeById, updateOvertimeById };
