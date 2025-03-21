import { AttendanceSchema, AttendanceBreakRecordSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
// import { pagination } from "../../../../utils/pagination.js";
import { pagination } from "../../../../utils/pagination.js";
// import {}
import cron from "node-cron";
import { late } from "zod";
// const cron = require('node-cron');

// Schedule job to run at 10 AM daily
cron.schedule('0 10 * * *', async () => {
    try {
        // Get all staff members for the admin
        const staffList = await prisma.staffDetails.findMany({
            where: { adminId: admin.user.adminDetails.id },
            select: { id: true }
        });

        // Get today's date
        const today = new Date().toISOString().split('T')[0]; // Get the current date in 'YYYY-MM-DD' format

        for (let staff of staffList) {
            // Check if attendance already exists for today
            const existingAttendance = await prisma.attendanceStaff.findFirst({
                where: {
                    staffId: staff.id,
                    date: today
                }
            });

            // If no attendance exists for the day, create it with status 'ABSENT'
            if (!existingAttendance) {
                await prisma.attendanceStaff.create({
                    data: {
                        shift: "Morning", // Default shift (or adjust based on your needs)
                        date: today,
                        status: "ABSENT",
                        staffDetails: {
                            connect: { id: staff.id }
                        },
                        adminDetail: {
                            connect: { id: admin.user.adminDetails.id } // Use dynamic admin ID
                        }
                    }
                });
                console.log(`Attendance marked as ABSENT for staff ${staff.id} on ${today}`);
            }
        }
    } catch (error) {
        console.error('Error creating automatic attendance:', error);
    }
});


// create attendance for staff true  false
const createAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        // Validate request body
        const validation = AttendanceSchema.parse(req.body);

        // Fetch staff details including dateOfJoining
        const staff = await prisma.staffDetails.findFirst({
            where: { id: validation.staffId, adminId: admin.user.adminDetails.id },
            select: { dateOfJoining: true }
        });

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Convert date strings to Date objects for comparison
        const dateOfJoining = new Date(staff.dateOfJoining);
        const attendanceDate = new Date(validation.date);
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

        // Find the last attendance date for this staff
        const lastAttendance = await prisma.attendanceStaff.findFirst({
            where: { staffId: validation.staffId },
            orderBy: { date: "desc" }, // Get the most recent attendance
            select: { date: true, endTime: true }
        });

        if (lastAttendance) {
            console.log("Last Attendance Date:", lastAttendance.date, "End Time:", lastAttendance.endTime);

            // If last attendance exists but has no endTime, prevent new attendance
            if (!lastAttendance.endTime) {
                return res.status(400).json({
                    message: `Complete the previous attendance first (Last attendance: ${lastAttendance.date}).`
                });
            }
        }

        // Check if the date is a Sunday (0 = Sunday)
        let status = validation.status;
        if (attendanceDate.getDay() === 0) {
            status = "WEEK_OFF"; // Automatically mark as WEEK_OFF
        }

        console.log(status);

        // Check if attendance already exists for the given date
        const existingAttendance = await prisma.attendanceStaff.findFirst({
            where: {
                staffId: validation.staffId,
                date: validation.date
            }
        });

        if (existingAttendance) {
            return res.status(400).json({ message: "Attendance for this date has already been recorded." });
        }

        const adminId = await prisma.user.findUnique({
            where: { id: req.userId },
            include: { adminDetails: true }
        });

        // Create attendance record
        const attendance = await prisma.attendanceStaff.create({
            data: {
                shift: validation.shift,
                date: validation.date,
                startTime: validation.startTime,
                endTime: validation.endTime,
                status: status,
                staffDetails: {
                    connect: { id: validation.staffId },
                },
                adminDetail: {
                    connect: { id: adminId.adminDetails.id },
                },
            },
            include: {
                staffDetails: {
                    include: { User: true },
                },
            },
        });

        res.status(200).json({ message: "Attendance created successfully", data: attendance });

    } catch (error) {
        next(error);
    }
};

// end attendance time
const updateAttendanceEndTime = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const { id: attendanceId } = req.params;
        const { endTime } = req.body;

        if (!endTime) {
            return res.status(400).json({ message: "End time is required to update attendance." });
        }

        const existingAttendance = await prisma.attendanceStaff.findUnique({
            where: { id: attendanceId }
        });

        if (!existingAttendance) {
            return res.status(404).json({ message: "Attendance record not found." });
        }

        const officeWorkingHours = admin.user.adminDetails.officeWorkinghours;
        const officeStartTime = admin.user.adminDetails.officeStartTime;
        const officeEndime = admin.user.adminDetails.officeEndtime;
        // console.log("office working hours ", officeWorkingHours, "office start time ", officeStartTime, "office end time ", officeEndime);
        function convertTo24HourFormat(timeString) {
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

            const startDate = new Date(`${date}T${start24.hours.toString().padStart(2, '0')}:${start24.minutes.toString().padStart(2, '0')}:00`);
            const endDate = new Date(`${date}T${end24.hours.toString().padStart(2, '0')}:${end24.minutes.toString().padStart(2, '0')}:00`);

            return (endDate - startDate) / (1000 * 60 * 60);
        }

        let workingHours = calculateWorkingHours(existingAttendance.startTime, endTime, existingAttendance.date);

        let requiredHours = officeWorkingHours;
        if (officeStartTime && officeEndTime) {
            requiredHours = calculateWorkingHours(officeStartTime, officeEndTime, existingAttendance.date);
        }

        let fineHours = 0;
        let overtimeHours = 0;
        let status = "PERSENT";
        // console.log(overtimeHours);
        // console.log(fineHours);
        console.log("working hours ", workingHours);
        const halfWorkingTime = requiredHours / workingHours
        if (workingHours <= halfWorkingTime) {
            status = "HALF_DAY";
            fineHours = 0;
        } else if ((workingHours > halfWorkingTime || workingHours < halfWorkingTime) && workingHours < requiredHours) {
            fineHours = requiredHours - workingHours;
            status = "PERSENT";
        } else if (workingHours > requiredHours) {
            overtimeHours = workingHours - requiredHours;
            status = "PERSENT";
        }
        console.log(" overtime hours ", overtimeHours);

        const salaryDetailsData = await prisma.salaryDetail.findFirst({
            where: { staffId: existingAttendance.staffId }
        });
        console.log(" salary details ", salaryDetailsData);
        if (salaryDetailsData) {
            const ctcAmount = salaryDetailsData.ctcAmount;
            console.log("ctc amount ", ctcAmount);
            // const ctcAmount = "15000";
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            console.log("days in month ", daysInMonth);
            const dailyCtc = ctcAmount / daysInMonth;
            console.log("daily ctc ", dailyCtc);
            const perHourRate = dailyCtc / requiredHours;
            console.log("per hour rate ", perHourRate);
            const fineAmount = fineHours * perHourRate;
            console.log("fine amount ", fineAmount);
            const overtimeAmount = overtimeHours * perHourRate;
            console.log("overtime amount ", overtimeAmount);

            const existingFine = await prisma.fine.findFirst({
                where: { attendanceStaffId: attendanceId }
            });
            if (fineHours > 0) {
                if (existingFine) {
                    console.log("Fine already exists for this attendance. Skipping fine creation.");
                    // return res.status(400).json({ message: "Fine already exists for this attendance. Skipping fine creation." });
                } else {
                    await prisma.fine.create({
                        data: {
                            adminId: admin.user.adminDetails.id,
                            AttendanceStaff: { connect: { id: attendanceId } },
                            staff: { connect: { id: existingAttendance.staffId } },
                            earlyOutFineHoursTime: fineHours.toFixed(2).toString(),
                            earlyOutFineAmount: parseFloat(perHourRate.toFixed(2)),
                            earlyOutAmount: parseFloat(fineAmount.toFixed(2)),
                            totalAmount: parseFloat(fineAmount.toFixed(2)),
                            SalaryDetail: { connect: { id: salaryDetailsData.id } },
                            sendSMStoStaff: true
                        }
                    });
                }
            }

            // Check if overtime already exists for the current attendance
            const existingOvertime = await prisma.overtime.findFirst({
                where: { attendanceStaffId: attendanceId }
            });

            if (overtimeHours > 0) {
                if (existingOvertime) {
                    console.log("Overtime already exists for this attendance. Skipping overtime creation.");
                } else {
                    await prisma.overtime.create({
                        data: {
                            adminId: admin.user.adminDetails.id,
                            staffId: existingAttendance.staffId,
                            totalAmount: parseFloat(overtimeAmount.toFixed(2)),
                            lateOutOvertimeHoursTime: overtimeHours.toFixed(2).toString(),
                            lateOutOvertimeAmount: parseFloat(perHourRate.toFixed(2)),
                            attendanceStaffId: attendanceId
                        }
                    });
                }
            }

        }
        console.log(status);
        const updatedAttendance = await prisma.attendanceStaff.update({
            where: { id: attendanceId },
            data: { endTime, status }
        });


        res.status(200).json({
            message: "Attendance updated successfully",
            data: updatedAttendance
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
        console.log(admin);

        const existingAdminId = await prisma.attendanceStaff.findFirst({
            where: {
                // id: attendanceId,
                adminId: admin.user.adminDetails.id,
            }
        });
        console.log(existingAdminId);
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
            return res.status(400).json({
                message: admin.message
            });
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

        const existsStaffId = await prisma.staffDetails.findUnique({
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

const createBulkAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const attendances = req.body;
        const validAttendances = []
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
                where: { staffId, date  }
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
}

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




export {
    getAllAttendance,
    createAttendance,
    updateAttendanceEndTime,
    getAttendanceByStaffId,
    getAttendanceByMonth,
    startAttendanceBreak,
    endAttendanceBreak,
    halfDayAttendance,
    getAllAttendanceByDate,
    getAllStartBreakRecord,
    getAllEndBreakRecord,
    createBulkAttendance,
};