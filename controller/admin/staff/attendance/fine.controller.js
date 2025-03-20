// import {OverTimeSchema, AttendanceSchema, AttendanceBreakRecordSchema } from "../../../../utils/validation.js";
import { FineSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";

const addFineData = async (req, res, next) => {
    const admin = await checkAdmin(req.userId, "ADMIN", res);
    if (admin.error) {
        return res.status(400).json({
            message: admin.message
        });
    }
    const {
        staffId,
        attendanceStaffId,
        lateEntryFineHoursTime,
        lateEntryFineAmount,
        lateEntryAmount,
        excessBreakFineHoursTime,
        excessBreakFineAmount,
        excessBreakAmount,
        earlyOutFineHoursTime,
        earlyOutFineAmount,
        earlyOutAmount,
        totalAmount
    } = req.body;

    // Validate input data using Zod schema
    const validation = FineSchema.safeParse({
        staffId,
        lateEntryFineAmount,
        lateEntryAmount,
        excessBreakFineAmount,
        excessBreakAmount,
        earlyOutFineAmount,
        earlyOutAmount,
        totalAmount,
    });

    if (!validation.success) {
        return res.status(400).json({ message: validation.error.issues[0].message });
    }

    // Ensure attendanceStaffId is provided
    if (!attendanceStaffId) {
        return res.status(400).json({ message: "attendanceStaffId is required to record fine." });
    }

    const exisitingStaff = await prisma.staffDetails.findFirst({
        where: {
            id: staffId,
            adminId: req.userId
        }
    });

    if (!exisitingStaff) {
        return res.status(400).json({ message: "Invalid staffId or staff does not belong to this admin" });
    }
    const existingAttendance = await prisma.attendanceStaff.findFirst({
        where: {
            id: attendanceId,
            adminId: req.userId
        }
    });

    if (!existingAttendance) {
        return res.status(400).json({ message: "Invalid attendanceId or attendnace does not belong to this admin" });
    }

    try {
        // Check if the attendanceStaffId exists in the database
        const staffAttendance = await prisma.attendanceStaff.findUnique({
            where: { id: attendanceStaffId },
        });

        if (!staffAttendance) {
            return res.status(404).json({ message: "Attendance record not found for the given attendanceStaffId." });
        }

        // Fetch salary details for the employee
        const salaryDetailsData = await prisma.salaryDetail.findFirst({
            where: { staffId: staffAttendance.staffId },
        });

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

        // Convert fine hours to minutes
        const lateEntryMinutes = parseInt(lateEntryFineHoursTime) || 0;
        const excessBreakMinutes = parseInt(excessBreakFineHoursTime) || 0;
        const earlyOutMinutes = parseInt(earlyOutFineHoursTime) || 0;

        // Convert minutes to hours format (HH:mm)
        const formatTime = (minutes) => `${Math.floor(minutes / 60)}:${minutes % 60}`;

        const formattedLateEntry = formatTime(lateEntryMinutes);
        const formattedExcessBreak = formatTime(excessBreakMinutes);
        const formattedEarlyOut = formatTime(earlyOutMinutes);

        // Apply fine multipliers and round off to 2 decimal places
        const lateEntryFine = parseFloat((lateEntryMinutes * perMinuteSalary * lateEntryFineAmount).toFixed(2));
        const excessBreakFine = parseFloat((excessBreakMinutes * perMinuteSalary * excessBreakFineAmount).toFixed(2));
        const earlyOutFine = parseFloat((earlyOutMinutes * perMinuteSalary * earlyOutFineAmount).toFixed(2));

        // Calculate total fine amount and round off
        const calculatedTotalFine = parseFloat((lateEntryFine + excessBreakFine + earlyOutFine).toFixed(2));

        // Check if a fine record already exists for the given attendanceStaffId
        const existingFine = await prisma.fine.findFirst({
            where: { attendanceStaffId },
        });

        if (existingFine) {
            // Update the existing fine record
            const fine = await prisma.fine.update({
                where: { id: existingFine.id },
                data: {
                    lateEntryFineHoursTime: formattedLateEntry,
                    lateEntryFineAmount,
                    lateEntryAmount,
                    excessBreakFineHoursTime: formattedExcessBreak,
                    excessBreakFineAmount,
                    excessBreakAmount,
                    earlyOutFineHoursTime: formattedEarlyOut,
                    earlyOutFineAmount,
                    earlyOutAmount,
                    totalAmount: calculatedTotalFine,
                    salaryDetailId: salaryDetailsData.id,
                    adminId: admin.user.adminDetails.id,
                },
            });

            return res.status(200).json({ message: "Fine updated successfully", fine });
        }

        // If no fine record exists, create a new one
        const fine = await prisma.fine.create({
            data: {
                staffId,
                attendanceStaffId,
                lateEntryFineHoursTime: formattedLateEntry,
                lateEntryFineAmount,
                lateEntryAmount,
                excessBreakFineHoursTime: formattedExcessBreak,
                excessBreakFineAmount,
                excessBreakAmount,
                earlyOutFineHoursTime: formattedEarlyOut,
                earlyOutFineAmount,
                earlyOutAmount,
                totalAmount: calculatedTotalFine,
                salaryDetailId: salaryDetailsData.id,
                adminId: admin.user.adminDetails.id,
            },
        });

        return res.status(201).json({ message: "Fine created successfully", fine });
    } catch (error) {
        next(error);
    }
};

// get all fine data
const getAllFine = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { page, limit } = req.query;
        const fine = await pagination(prisma.fine, {
            page, limit,
            where: {
                adminId: admin.user.adminDetails.id
            },
            include: {
                staffDetails: {
                    include: {
                        User: true,
                    },
                },
                attendanceStaff: true,
            },
        });
        res.status(200).json({ message: "Fine fetched successfully", ...fine });
    } catch (error) {
        next(error);
    }
};

// get by fine id
const getFineById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { id } = req.params;
        const fine = await prisma.fine.findUnique({
            where: { id },
            include: {
                staffDetails: {
                    include: {
                        User: true,
                    },
                },
                attendanceStaff: true,
            },
        });
        res.status(200).json({ message: "Fine fetched successfully", fine });
    } catch (error) {
        next(error);
    }
}

// delete fine by id
const deleteFineById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { id } = req.params;
        const fine = await prisma.fine.delete({
            where: { id },
        });
        res.status(200).json({ message: "Fine deleted successfully", fine });
    } catch (error) {
        next(error);
    }
}

const bulkDeleteFineById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }

        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Please provide a valid array of fine IDs to delete." });
        }

        if (!ids.every(id => typeof id === "string" || typeof id === "number")) {
            return res.status(400).json({ message: "Invalid ID format detected in the request." });
        }

        const fine = await prisma.fine.deleteMany({
            where: {
                id: { in: ids },
            },
        });

        if (fine.count === 0) {
            return res.status(404).json({ message: "No fines found for the given IDs." });
        }

        res.status(200).json({ message: "Fines deleted successfully", deletedCount: fine.count });
    } catch (error) {
        next(error);
    }
};

// update by id fine data 
const updateFineById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { id } = req.params;
        const validation = FineSchema.parse(req.body);

        const fine = await prisma.fine.update({
            where: { id },
            data: validation.data,
        });
        res.status(200).json({ message: "Fine updated successfully", fine });
    } catch (error) {
        next(error);
    }
};


export { addFineData, getAllFine, getFineById, deleteFineById, bulkDeleteFineById, updateFineById };
