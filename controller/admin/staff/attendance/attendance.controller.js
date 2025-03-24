import { AttendanceSchema, AttendanceBreakRecordSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";
import { late } from "zod";
import { stat } from "fs";
import { create } from "domain";

function formatHoursToTime(decimalHours) {
    if (decimalHours < 0 || decimalHours >= 24) return "00:00"; // Handle edge cases

    let hours = Math.floor(decimalHours); // Extract whole hours
    let minutes = Math.round((decimalHours - hours) * 60); // Convert fraction to minutes

    if (minutes === 60) { // Handle rounding up to next hour
        hours += 1;
        minutes = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

}

function calculateWorkedHours(startTime, endTime) {
    function parseTimeToMinutes(time) {
        let match = time.match(/(\d+):(\d+)\s?(AM|PM)?/i);

        if (!match) {
            return null; // Return null for invalid formats instead of throwing an error
        }

        let [hour, minute, period] = match.slice(1);
        hour = parseInt(hour, 10);
        minute = parseInt(minute, 10);

        if (period) {
            // Convert AM/PM format to 24-hour format
            if (period.toUpperCase() === "PM" && hour !== 12) hour += 12;
            if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
        } else {
            // Assume 24-hour format if AM/PM is missing
            if (hour === 24) hour = 0; // Handle "24:00" as midnight
        }

        return hour * 60 + minute; // Total minutes from midnight
    }

    let startMinutes = parseTimeToMinutes(startTime);
    let endMinutes = parseTimeToMinutes(endTime);

    if (endMinutes < startMinutes) {
        // If endTime is earlier than or equal to startTime, assume endTime is the next day
        endMinutes += 24 * 60;
    }

    let workedMinutes = endMinutes - startMinutes;
    let workedHours = workedMinutes / 60;

    return workedHours;
}

const createAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const { staffId, shift, date, startTime, endTime, status } = req.body;

        let officeWorkingHours = admin.user.adminDetails.officeWorkinghours;
        const officeStartTime = admin.user.adminDetails.officeStartTime;
        const officeEndtime = admin.user.adminDetails.officeEndtime;
        if (officeStartTime && officeEndtime) {
            officeWorkingHours = calculateWorkedHours(officeStartTime, officeEndtime);
        }

        console.log("Office Working Hours jjj:", officeWorkingHours);
        console.log("Office Start Time kk :", officeStartTime);
        console.log("Office End Time kljl k:", officeEndtime);

        // Fetch staff details including dateOfJoining
        const staff = await prisma.staffDetails.findFirst({
            where: { id: staffId, adminId: admin.user.adminDetails.id },
            select: { dateOfJoining: true }
        });

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Convert date strings to Date objects for comparison
        const dateOfJoining = new Date(staff.dateOfJoining);
        const attendanceDate = new Date(date);
        const currentDate = new Date();

        dateOfJoining.setHours(0, 0, 0, 0);
        attendanceDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        if (attendanceDate < dateOfJoining) {
            return res.status(400).json({ message: "Attendance cannot be marked before the date of joining." });
        }

        if (attendanceDate > currentDate) {
            return res.status(400).json({ message: "Attendance cannot be marked for a future date." });
        }

        let attendanceStatus = status.trim().toUpperCase();
        if (!["ABSENT", "HALF_DAY", "PAID_LEAVE", "PERSENT"].includes(attendanceStatus)) {
            return res.status(400).json({ message: "Invalid status provided." });
        }

        let existingAttendance = await prisma.attendanceStaff.findFirst({
            where: { staffId: staffId, date: date }
        });
        let attendanceEntry;

        if (existingAttendance) {
            attendanceEntry = await prisma.attendanceStaff.update({
                where: { id: existingAttendance.id },
                data: { status: attendanceStatus, startTime, endTime }
            });
        }
        else {

            attendanceEntry = await prisma.attendanceStaff.create({
                data: {
                    adminId: admin.user.adminDetails.id,
                    staffId: staffId,
                    shift: shift,
                    date: date,
                    startTime: startTime,
                    endTime: endTime,
                    status: attendanceStatus
                }
            });
        }



        if (attendanceEntry && status !== "PERSENT") {
            const findOvertimeEntry = await prisma.overtime.findFirst({
                where: { staffId: staffId, date: date }
            })
            if (findOvertimeEntry) {
                await prisma.overtime.delete({
                    where: { id: findOvertimeEntry.id }
                });
            }
            const findFineEntry = await prisma.fine.findFirst({
                where: { staffId: staffId, date: date }
            });
            if (findFineEntry) {
                await prisma.fine.delete({
                    where: { id: findFineEntry.id }
                });
            }

            console.log("Updated Attendance Entry:", attendanceEntry);
        } else {
            console.log("New Attendance Entry:", attendanceEntry);
        }
        if (attendanceEntry && status === "PERSENT") {
            // Proceed with Fine Calculation after creating or updating the attendance entry

            const workedHours = calculateWorkedHours(startTime, endTime === "" ? endTime : "00:00");
            const salaryDetails = await prisma.salaryDetail.findFirst({
                where: { staffId: staffId }

            });

            const monthDays = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth() + 1, 0).getDate();
            const ctcAmount = salaryDetails.ctcAmount;
            const perDaySalary = ctcAmount / monthDays;
            const perHourSalary = perDaySalary / officeWorkingHours;
            if (workedHours < officeWorkingHours) {

                console.log("sldjfldsjfklsd");
                if (salaryDetails) {
                    const missingHours = officeWorkingHours - workedHours;
                    const fineAmount = missingHours * perHourSalary;

                    const findOvertime = await prisma.overtime.findFirst({
                        where: { staffId: staffId, date: date }
                    })

                    if (findOvertime) {
                        await prisma.overtime.delete({
                            where: { id: findOvertime.id },
                        })
                    }
                    console.log("missing  hours:", missingHours);
                    console.log("worked hours", workedHours);

                    // Check if fine entry already exists
                    let existingFine = await prisma.fine.findFirst({
                        where: { staffId: staffId, date }
                    });

                    if (existingFine) {
                        // Update fine entry
                        await prisma.fine.update({
                            where: { id: existingFine.id },
                            data: {
                                lateEntryFineHoursTime: formatHoursToTime(missingHours),
                                lateEntryAmount: parseFloat(fineAmount.toFixed(2)),
                                date: date,
                                totalAmount: parseFloat(fineAmount.toFixed(2)),
                            }
                        });
                        console.log("Fine updated");
                    } else {
                        // Create fine entry
                        await prisma.fine.create({
                            data: {
                                // staffId: staffId,
                                // attendanceId: attendanceEntry.id,
                                staff: {
                                    connect: {
                                        id: staffId
                                    }
                                },
                                AttendanceStaff: {
                                    connect: {
                                        id: attendanceEntry.id
                                    }
                                },
                                SalaryDetail: {
                                    connect: {
                                        id: salaryDetails.id
                                    }
                                },
                                adminId: admin.user.adminDetails.id,
                                // salaryId: salaryDetails.id,
                                lateEntryFineHoursTime: formatHoursToTime(missingHours),
                                lateEntryAmount: parseFloat(fineAmount.toFixed(2)),
                                date: date,
                                totalAmount: parseFloat(fineAmount.toFixed(2)),
                            }
                        });
                        console.log("Fine created");
                    }
                }
            }
            else if (workedHours > officeWorkingHours) {
                console.log("Office Working Hours:", officeWorkingHours);
                console.log("Worked Hours:", workedHours);
                const findFine = await prisma.fine.findFirst({
                    where: {
                        staffId: staffId,
                        date: date
                    }
                })

                if (findFine) {
                    await prisma.fine.delete({
                        where: {
                            id: findFine.id
                        }
                    })
                }
                const overtimeHours = workedHours - officeWorkingHours;
                console.log("Overtime Hours:", overtimeHours);
                console.log("Per Hour Salary:", perHourSalary);
                const totalOvertimeAmount = Number(perHourSalary) * Number(overtimeHours);
                console.log("Total Overtime Amount:", totalOvertimeAmount);
                let existingOvertime = await prisma.overtime.findFirst({ where: { staffId: staffId, date: date } });
                if (existingOvertime) {
                    await prisma.overtime.update({
                        where: { id: existingOvertime.id },
                        data: {
                            lateOutOvertimeHoursTime: formatHoursToTime(overtimeHours),
                            date: date,
                            totalAmount: parseFloat(totalOvertimeAmount.toFixed(2))
                        }
                    });
                } else {
                    await prisma.overtime.create({
                        data: {
                            staff: {
                                connect: {
                                    id: staffId
                                }
                            },
                            AttendanceStaff: {
                                connect: {
                                    id: attendanceEntry.id
                                }
                            },
                            SalaryDetail: {
                                connect: {
                                    id: salaryDetails.id
                                }
                            },
                            adminId: admin.user.adminDetails.id,
                            lateOutOvertimeHoursTime: formatHoursToTime(overtimeHours),
                            date: date,
                            totalAmount: parseFloat(totalOvertimeAmount.toFixed(2))
                        }
                    });
                }


            }


        }
        res.status(200).json({
            message: existingAttendance ? "Attendance updated successfully" : "Attendance created successfully",
            data: attendanceEntry
        });


    } catch (error) {
        next(error);
    }
};

// get all attendance
const getAllAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const existingAdminId = await prisma.attendanceStaff.findFirst({
            where: {
                // id: attendanceId,
                adminId: admin.user.adminDetails.id,
            }
        });
        if (!existingAdminId || (existingAdminId.adminId !== admin.user.adminDetails.id)) {
            return res.status(400).json({ message: "Invalid adminId" });
        }
        const { page, limit } = req.query;
        const attendance = await pagination(prisma.attendanceStaff, {
            page, limit,
            where: {
                adminId: admin.user.adminDetails.id,
            },
            include: {
                staffDetails: {
                    include: {
                        User: true,
                    },
                },
                attendanceBreakRecord: true,
                fine: true
            },
        });
        res.status(200).json({ message: "Attendance fetched successfully", ...attendance });
    } catch (error) {
        next(error);
    }
};

// get attendance by staff id 
const getAttendanceByStaffId = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }
        const { page, limit } = req.query;
        const { staffId } = req.params;
        if (!staffId) {
            return res.status(400).json({ message: "staffId is required" });
        }
        console.log(staffId);
        const attendance = await pagination(prisma.attendanceStaff, {
            page, limit,
            where: {
                // adminId: admin.id,
                staffId: staffId,
                adminId: admin.user.adminDetails.id
            },
            include: {
                staffDetails: {
                    include: {
                        User: true,
                    },
                },
                attendanceBreakRecord: true,
                fine: true
            },
        });
        console.log(" attedance data ", attendance);
        res.status(200).json({ message: "Attendance fetched successfully", ...attendance });
    } catch (error) {
        next(error);
    }
}

// get attendance by month or year
const getAttendanceByMonth = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { staffId } = req.params;
        const { month, year, page = 1, limit = 10 } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year are required" });
        }

        const existsStaffId = await prisma.staffDetails.findFirst({
            where: {
                id: staffId,
                adminId: admin.user.adminDetails.id
            },
        });
        if (!existsStaffId) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Ensure month and year are numbers
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        const startDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`;
        const endDate = new Date(yearNum, monthNum, 0).getDate();
        const endDateString = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${endDate}`;

        // Fetch attendance with correct string comparison
        const attendanceRecords = await pagination(prisma.attendanceStaff, {
            page,
            limit,
            where: {
                staffId: staffId,
                adminId: admin.user.adminDetails.id,
                date: {
                    gte: startDate,
                    lte: endDateString,
                },
            },
            orderBy: {
                date: "asc",
            },
        });

        res.status(200).json({
            message: "Attendance records fetched successfully",
            data: attendanceRecords,
        });

    } catch (error) {
        next(error);
    }
};

// start break and end break
const startAttendanceBreak = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        console.log(admin);
        // Validate request body
        const validation = AttendanceBreakRecordSchema.parse(req.body);
        const { startBreak, attendanceId, location, staffId, startBreakImage } = validation;
        console.log(req.file);
        // Ensure attendance exists
        const attendance = await prisma.attendanceStaff.findFirst({
            where: { id: attendanceId, adminId: admin.user.adminDetails.id },
        });

        if (!attendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        // Check if attendance has already ended
        if (attendance.endTime) {
            return res.status(400).json({ message: "Cannot start break. Attendance has already ended." });
        }

        // Check if an active break exists (i.e., a break that hasn't ended yet)
        const ongoingBreak = await prisma.attendanceBreakRecord.findFirst({
            where: {
                attendanceId: attendanceId,
                staffId: staffId,
                endBreak: null,
            },
        });

        if (ongoingBreak) {
            return res.status(400).json({ message: "Cannot start a new break until the previous break has ended." });
        }
        // Create break record with only startBreak
        const breakRecord = await prisma.attendanceBreakRecord.create({
            data: {
                adminId: req.userId,
                startBreak,
                attendanceId,
                location,
                staffId,
                startBreakImage: req.file.path || null,
            },
            include: {
                staffDetails: true,
                attendanceStaff: true,
            },
        });

        res.status(201).json({ message: "Break started successfully", data: breakRecord });
    } catch (error) {
        next(error);
    }
};
const endAttendanceBreak = async (req, res, next) => {
    const { startBreakid } = req.params;

    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }

        const { endBreak } = req.body;

        if (!endBreak || !req.file) {
            return res.status(400).json({ message: "End Break time and image are required" });
        }

        // Ensure the break record exists
        const existingBreak = await prisma.attendanceBreakRecord.findUnique({
            where: { id: startBreakid },
        });

        if (!existingBreak) {
            return res.status(404).json({ message: "Break record not found" });
        }

        if (existingBreak.endBreak) {
            return res.status(400).json({ message: "Break already ended" });
        }

        // Update break record with endBreak time
        const updatedBreak = await prisma.attendanceBreakRecord.update({
            where: { id: startBreakid },
            data: {
                endBreak,
                endBreakImage: req.file ? req.file.path : null,
            },
        });

        res.status(200).json({ message: "Break ended successfully", data: updatedBreak });

    } catch (error) {
        next(error);
    }
};

// halfday Attendance 
const halfDayAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        console.log("Admin details:", admin);

        let validation;
        try {
            validation = AttendanceSchema.parse(req.body);
        } catch (validationError) {
            return res.status(400).json({ message: "Invalid request data", error: validationError.errors });
        }
        const { adminId } = req.body;

        const { attendanceId, staffId, shift, date, startTime, endTime } = validation;
        console.log("attdnance Id ", attendanceId)
        if (!endTime) {
            return res.status(400).json({ message: "End time is required for half-day attendance." });
        }
        // const es = admin.user.adminDetails.userId;
        const existingStaffId = await prisma.attendanceStaff.findFirst({
            where: {
                adminId: adminId,
                staffId: staffId
            }
        })

        // console.log("Half-day attendance data:", admin.user.adminDetails.id);
        // console.log("Half-day attendance data:", existingStaffId.adminId);
        if (existingStaffId && (existingStaffId.adminId !== adminId)) {
            return res.status(400).json({ message: "Invalid adminId" });
        }

        const exisitingStaff = await prisma.staffDetails.findFirst({
            where: {
                id: staffId,
                adminId: adminId
            }
        });

        if (!exisitingStaff) {
            return res.status(400).json({ message: "Invalid staffId or staff does not belong to this admin" });
        }
        const existingAttendance = await prisma.attendanceStaff.findFirst({
            where: {
                id: attendanceId,
                adminId: adminId
            }
        });

        if (!existingAttendance) {
            return res.status(400).json({ message: "Invalid attendanceId or attendnace does not belong to this admin" });
        }

        let attendance;

        if (attendanceId) {
            // Check if the given attendance ID exists
            attendance = await prisma.attendanceStaff.findUnique({
                where: { id: attendanceId },
            });

            if (attendance) {
                // If attendance exists, ensure it's not already marked as HALF_DAY
                if (attendance.status === "HALF_DAY") {
                    return res.status(400).json({ message: "Attendance is already marked as HALF_DAY" });
                }

                // Update existing attendance record
                attendance = await prisma.attendanceStaff.update({
                    where: { id: attendanceId },
                    data: {
                        shift,
                        startTime,
                        endTime,
                        status: "HALF_DAY",
                    },
                    include: { staffDetails: true },
                });

                return res.status(200).json({ message: "Half-day attendance updated successfully", data: attendance });
            }
        }

        // If attendanceId is not provided or not found, check if a record exists for the same staffId & date
        attendance = await prisma.attendanceStaff.findFirst({
            where: { attendanceId, staffId, date },
        });

        if (attendance) {
            // Update existing attendance record for the same date
            attendance = await prisma.attendanceStaff.update({
                where: { id: attendance.id },
                data: {
                    shift,
                    startTime,
                    endTime,
                    status: "HALF_DAY",
                },
                include: { staffDetails: true },
            });

            return res.status(200).json({ message: "Half-day attendance updated successfully", data: attendance });
        }

        // If no existing attendance for that date, create a new record
        attendance = await prisma.attendanceStaff.create({
            data: {
                staffId,
                adminId: admin.user.adminDetails.id,
                shift,
                date,
                startTime,
                endTime,
                status: "HALF_DAY",
            },
            include: { staffDetails: true },
        });

        return res.status(201).json({ message: "Half-day attendance recorded successfully", data: attendance });

    } catch (error) {
        next(error);
    }
};

// get attendance by date for all staff
const getAllAttendanceByDate = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }

        const { page, limit, date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD." });
        }

        // Convert date to 'YYYY-MM-DD' string format if 'date' field is stored as a string
        const formattedDate = parsedDate.toISOString().split('T')[0]; // '2024-12-15'

        const attendance = await pagination(prisma.attendanceStaff, {
            page, limit,
            where: {
                adminId: admin.user.adminDetails.id,
                date: {
                    equals: formattedDate, // Compare using the string format 'YYYY-MM-DD'
                },
            },
            include: {
                staffDetails: {
                    include: {
                        User: true,
                    },
                },
                attendanceBreakRecord: true,
                fine: true
            },
        });

        res.status(200).json({ message: "Attendance fetched successfully", ...attendance });
    } catch (error) {
        next(error);
    }
};

// get all start break record
const getAllStartBreakRecord = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { page, limit } = req.query;
        const breakRecord = await pagination(prisma.attendanceBreakRecord, {
            page, limit,
            where: {
                adminId: admin.user.adminDetails.id
            }
        });
        res.status(200).json({ message: "Break record fetched successfully", data: breakRecord });
    } catch (error) {
        next(error);
    }
};

// get  all end break record
const getAllEndBreakRecord = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { page, limit } = req.query;
        const breakRecord = await pagination(prisma.attendanceBreakRecord, {
            page, limit,
            where: {
                adminId: admin.user.adminDetails.id
            }
        });
        res.status(200).json({ message: "Break record fetched successfully", data: breakRecord });
    } catch (error) {
        next(error);
    }
};
const createBulkAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const attendances = req.body;
        const validAttendances = [];
        const errors = [];
        const createdRecords = [];

        for (const att of attendances) {
            const { staffId, date, shift, startTime, endTime, status } = att;

            const staff = await prisma.staffDetails.findFirst({
                where: { id: staffId, adminId: admin.user.adminDetails.id },
                select: { dateOfJoining: true }
            });

            if (!staff) {
                errors.push({ date, message: "Staff not found." });
                continue;
            }

            const dateOfJoining = new Date(staff.dateOfJoining);
            dateOfJoining.setHours(0, 0, 0, 0);

            const attendanceDate = new Date(date);
            attendanceDate.setHours(0, 0, 0, 0);

            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            if (attendanceDate < dateOfJoining) {
                errors.push({ date, message: "Attendance cannot be marked before the date of joining." });
                continue;
            }

            if (attendanceDate > currentDate) {
                errors.push({ date, message: "Attendance cannot be marked for a future date." });
                continue;
            }

            const existingAttendance = await prisma.attendanceStaff.findFirst({
                where: { staffId, date }
            });

            if (existingAttendance) {
                errors.push({ date, message: "Attendance for this date has already been recorded." });
                continue;
            }

            let effectiveStatus = status || "PERSENT";
            if (attendanceDate.getDay() === 0) {
                effectiveStatus = "WEEK_OFF";
            }

            // Create attendance record manually
            const attendance = await prisma.attendanceStaff.create({
                data: {
                    shift,
                    date,
                    startTime,
                    endTime,
                    status: effectiveStatus,
                    staffDetails: {
                        connect: {
                            id: staffId
                        }
                    },
                    adminDetail: {
                        connect: {
                            id: admin.user.adminDetails.id
                        }
                    }
                }
            });

            createdRecords.push(attendance);
        }

        if (createdRecords.length === 0) {
            return res.status(400).json({ message: "No valid attendance records created.", errors });
        }

        res.status(200).json({
            message: "Bulk attendance created successfully.",
            createdRecords,
            errors
        });

    } catch (error) {
        next(error);
    }
};

export {
    createAttendance, getAllAttendance, getAttendanceByStaffId, startAttendanceBreak, createBulkAttendance,
    endAttendanceBreak, getAttendanceByMonth, halfDayAttendance, getAllAttendanceByDate, getAllStartBreakRecord, getAllEndBreakRecord
}
