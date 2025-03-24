// import {OverTimeSchema, AttendanceSchema, AttendanceBreakRecordSchema } from "../../../../utils/validation.js";
import { FineSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";
import { sendFineToStaff, sendFineUpdateToStaff } from "../../../../utils/emailService.js";

const addFineData = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
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
            totalAmount,
            applyFine
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

        if (!attendanceStaffId) {
            return res.status(400).json({ message: "attendanceStaffId is required to record fine." });
        }

        const existingStaff = await prisma.staffDetails.findFirst({
            where: {
                id: staffId,
                adminId: admin.user.adminDetails.id,
            },
            include: {
                User: {
                    select: { email: true }
                }
            }
        });
        const staffEmails = existingStaff.User.email;
        console.log("admin.user.adminDetails.id", staffEmails);

        if (!existingStaff) {
            return res.status(400).json({ message: "Invalid staffId or staff does not belong to this admin" });
        }

        const existingAttendance = await prisma.attendanceStaff.findFirst({
            where: { id: attendanceStaffId, adminId: admin.user.adminDetails.id }
        });
        // console.log("admin.user.adminDetails.id", existingAttendance);
        if (!existingAttendance) {
            return res.status(400).json({ message: "Invalid attendanceStaffId or attendance does not belong to this admin" });
        }

        const salaryDetailsData = await prisma.salaryDetail.findFirst({
            where: { staffId: existingAttendance.staffId }
        });

        if (!salaryDetailsData) {
            return res.status(404).json({ message: "Salary details not found for the given staffId." });
        }

        const officeWorkingHours = admin.user.adminDetails.officeWorkinghours;
        const officeStartTime = admin.user.adminDetails.officeStartTime;
        const officeEndTime = admin.user.adminDetails.officeEndtime;

        function convertTo24HourFormat(timeString) {
            if (!timeString) return null;
            let [time, modifier] = timeString.split(/(AM|PM)/);
            let [hours, minutes] = time.split(':').map(num => parseInt(num, 10));

            if (modifier === "AM" && hours === 12) {
                hours = 0;
            } else if (modifier === "PM" && hours !== 12) {
                hours += 12;
            }
            return { hours, minutes };
        }

        function calculateWorkingHours(startTime, endTime, date) {
            const start24 = convertTo24HourFormat(startTime);
            const end24 = convertTo24HourFormat(endTime);

            if (!start24 || !end24) return officeWorkingHours; // Default to officeWorkingHours if any value is missing

            const startDate = new Date(`${date}T${start24.hours.toString().padStart(2, '0')}:${start24.minutes.toString().padStart(2, '0')}:00`);
            const endDate = new Date(`${date}T${end24.hours.toString().padStart(2, '0')}:${end24.minutes.toString().padStart(2, '0')}:00`);

            return (endDate - startDate) / (1000 * 60 * 60);
        }

        let requiredHours = officeWorkingHours;
        if (officeStartTime && officeEndTime) {
            requiredHours = calculateWorkingHours(officeStartTime, officeEndTime, existingAttendance.date);
        }

        // Salary calculations
        const ctcAmount = salaryDetailsData.ctcAmount;
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const dailyCtc = ctcAmount / daysInMonth;
        const perHourSalary = dailyCtc / requiredHours;
        const convertedMinutsToHours = 60;
        const perMinuteSalary = perHourSalary / convertedMinutsToHours;

        // Convert fine hours to minutes
        const lateEntryMinutes = parseInt(lateEntryFineHoursTime) || 0;
        const excessBreakMinutes = parseInt(excessBreakFineHoursTime) || 0;
        const earlyOutMinutes = parseInt(earlyOutFineHoursTime) || 0;

        // Convert minutes to HH:mm format
        const formatTime = (minutes) => `${Math.floor(minutes / convertedMinutsToHours)}:${minutes % convertedMinutsToHours}`;
        const formattedLateEntry = formatTime(lateEntryMinutes);
        const formattedExcessBreak = formatTime(excessBreakMinutes);
        const formattedEarlyOut = formatTime(earlyOutMinutes);

        // Fine calculations
        const lateEntryFine = parseFloat((lateEntryMinutes * perMinuteSalary * lateEntryFineAmount).toFixed(2));
        const excessBreakFine = parseFloat((excessBreakMinutes * perMinuteSalary * excessBreakFineAmount).toFixed(2));
        const earlyOutFine = parseFloat((earlyOutMinutes * perMinuteSalary * earlyOutFineAmount).toFixed(2));
        const calculatedTotalFine = parseFloat((lateEntryFine + excessBreakFine + earlyOutFine).toFixed(2));

        const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

        // Check if  a fine record already exists for the same attendanceStaffId on the current date
        const existingFine = await prisma.fine.findFirst({
            where: {
                attendanceStaffId,
                createdAt: { gte: new Date(`${currentDate}T00:00:00Z`), lte: new Date(`${currentDate}T23:59:59Z`) }
            }
        });

        if (existingFine) {
            // Update the existing fine
            const fine = await prisma.fine.update({
                where: { id: existingFine.id },
                data: {
                    staffId: existingAttendance.staffId,
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
                    applyFine: applyFine
                },
            });
            const checkSendSMStoStaffisTrue = await prisma.fine.findFirst({
                where: {
                    attendanceStaffId: req.body.attendanceStaffId,
                    adminId: admin.user.adminDetails.id,
                },
                select: { sendSMStoStaff: true }
            });
            const sendMail = await sendFineUpdateToStaff(staffEmails)
            console.log("checkSendSMStoStaffisTrue:", checkSendSMStoStaffisTrue);
            console.log("fine updated");

            return res.status(200).json({ message: "Fine updated successfully", fine });
        }

        // Create a new fine record if no existing fine for today
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
                applyFine: applyFine
            },
        });

        const checkSendSMStoStaffisTrue = await prisma.fine.findFirst({
            where: {
                attendanceStaffId: req.body.attendanceStaffId,
                adminId: admin.user.adminDetails.id,
            },
            select: { sendSMStoStaff: true }
        });
        const sendMail = await sendFineUpdateToStaff(staffEmails)
        console.log("checkSendSMStoStaffisTrue:", checkSendSMStoStaffisTrue);
        // send email to staff email


        return res.status(201).json({ message: "Fine created successfully", fine, sendMail });
        console.log("fine created successfully");
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
