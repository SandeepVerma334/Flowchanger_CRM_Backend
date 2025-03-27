// import {OverTimeSchema, AttendanceSchema, AttendanceBreakRecordSchema } from "../../../../utils/validation.js";
import { OverTimeSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";
import { date } from "zod";

const convertToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
};
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
        applyOvertime
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

        if (!staffAttendance) {
            return res.status(404).json({ message: "Attendance record not found for the given attendanceStaffId." });
        }
        // Fetch salary details for the employee
        const salaryDetailsData = await prisma.salaryDetail.findFirst({
            where: { staffId: staffAttendance.staffId, adminId: req.userId },
        });
        // console.log("salaryDetailsData", salaryDetailsData);
        if (!salaryDetailsData) {
            return res.status(404).json({ message: "Salary details not found for the given staffId." });
        }
        const officeStartTime = admin.user.adminDetails.officeStartTime;
        const officeEndTime = admin.user.adminDetails.officeEndtime;
        const convertTo24HourFormat = (timeString) => {
            if (!timeString) return null;

            let [time, modifier] = timeString.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (modifier === 'AM' && hours === 12) hours = 0;
            if (modifier === 'PM' && hours !== 12) hours += 12;

            return { hours, minutes };
        };

        // Function to calculate hours between two times
        const calculateWorkingHours = (startTime, endTime) => {
            const start = convertTo24HourFormat(startTime);
            const end = convertTo24HourFormat(endTime);

            if (!start || !end) return 0;

            const startDate = new Date();
            startDate.setHours(start.hours, start.minutes, 0);

            const endDate = new Date();
            endDate.setHours(end.hours, end.minutes, 0);

            return (endDate - startDate) / (1000 * 60 * 60); // Convert milliseconds to hours
        };
        const totalWorkingHours = calculateWorkingHours(officeStartTime, officeEndTime);

        const ctcAmount = salaryDetailsData.ctcAmount;
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyCtc = ctcAmount / daysInMonth;
        const workingHoursPerDay = totalWorkingHours;
        const perHourSalary = dailyCtc / workingHoursPerDay;
        const perMinuteSalary = perHourSalary / 60;
        const convertedMinutsToHours = 60;
        // Convert early and late overtime hours to minutes
        const earlyCommingMinutes = parseInt(convertToMinutes(earlyCommingEntryHoursTime)) || 0;
        const lateOutMinutes = parseInt(convertToMinutes(lateOutOvertimeHoursTime)) || 0;

        // Apply overtime multipliers
        const earlyCommingOvertime = earlyCommingMinutes * perMinuteSalary;
        const earlyCommingOvertimeAmount = earlyCommingOvertime * earlyCommingEntryAmount;

        const lateOutOvertime = lateOutMinutes * perMinuteSalary;
        const lateOutOvertimeAmounts = lateOutOvertime * lateOutOvertimeAmount;

        // Calculate total overtime amount
        const calculatedTotalOvertime = earlyCommingOvertimeAmount + lateOutOvertimeAmounts;

        const formatTime = (minutes) => {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        };
        const formattedlateOutEntryTime = formatTime(lateOutMinutes);
        const formattedEarlyCommingTime = formatTime(earlyCommingMinutes);

        // find firstly fine entry exist then delete first and then create
        const findFineEntry = await prisma.fine.findFirst({
            where: {
                attendanceStaffId: attendanceStaffId,
                date: attendanceStaffId.date
            }
        })
        if (findFineEntry) {
            await prisma.fine.delete({
                where: { id: findFineEntry.id }
            });
        }
        // Check if an overtime record already exists for the given attendanceStaffId
        const existingOvertime = await prisma.overtime.findFirst({
            where: { attendanceStaffId: attendanceStaffId },
        });

        // console.log("existingOvertime", existingOvertime);
        if (existingOvertime) {
            // Update the existing overtime record
            const overtime = await prisma.overtime.update({
                where: { id: existingOvertime.id },
                data: {
                    earlyCommingEntryAmount,
                    earlyCommingEntryHoursTime: formattedEarlyCommingTime,
                    earlyEntryAmount: parseFloat(earlyCommingOvertimeAmount.toFixed(2)),
                    lateOutOvertimeHoursTime: formattedlateOutEntryTime,
                    lateOutOvertimeAmount,
                    lateOutAmount: parseFloat(lateOutOvertimeAmounts.toFixed(2)),
                    totalAmount: parseFloat(calculatedTotalOvertime.toFixed(2)),
                    salaryDetailId: salaryDetailsData.id,
                    adminId: admin.user.adminDetails.id,
                    date: staffAttendance.date,
                    applyOvertime,
                },
            });

            return res.status(201).json({ message: "Overtime updated successfully", overtime });
        }

        // If no overtime record exists, create a new one
        const overtime = await prisma.overtime.create({
            data: {
                staffId,
                attendanceStaffId,
                earlyCommingEntryAmount,
                earlyCommingEntryHoursTime: formattedEarlyCommingTime,
                earlyEntryAmount: parseFloat(earlyCommingOvertimeAmount.toFixed(2)),
                lateOutOvertimeHoursTime: formattedlateOutEntryTime,
                lateOutOvertimeAmount,
                lateOutAmount: parseFloat(lateOutOvertimeAmounts.toFixed(2)),
                totalAmount: parseFloat(calculatedTotalOvertime.toFixed(2)),
                salaryDetailId: salaryDetailsData.id,
                adminId: admin.user.adminDetails.id,
                date: staffAttendance.date,
                applyOvertime,
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
