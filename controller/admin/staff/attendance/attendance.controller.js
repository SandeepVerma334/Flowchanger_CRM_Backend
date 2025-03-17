import { AttendanceSchema, AttendanceBreakRecordSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
// import { pagination } from "../../../../utils/pagination.js";
import { pagination } from "../../../../utils/pagination.js";
// import {}

// create attendance for staff true  false
const createAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN");
        console.log(admin);
        if(!admin) return res.status(401).json({message:"User not authorized"});
        // Validate request body
        const validation = AttendanceSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                error: "Invalid data format",
                issues: validation.error.issues.map((err) => err.message),
            });
        }

        // Fetch staff details including dateOfJoining
        const staff = await prisma.staffDetails.findUnique({
            where: { id: validation.data.staffId },
            select: { dateOfJoining: true }
        });

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Convert date strings to Date objects for comparison
        const dateOfJoining = new Date(staff.dateOfJoining);
        const attendanceDate = new Date(validation.data.date);
        const currentDate = new Date();

        // Normalize dates to compare only date parts (ignore time)
        dateOfJoining.setHours(0, 0, 0, 0);
        attendanceDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        // Check if attendance date is before the staff's joining date
        if (attendanceDate < dateOfJoining) {
            return res.status(400).json({
                message: "Attendance cannot be marked before the date of joining."
            });
        }

        // Check if attendance date is in the future (beyond today)
        if (attendanceDate > currentDate) {
            return res.status(400).json({
                message: "Attendance cannot be marked for a future date."
            });
        }

        // Check if attendance is already marked for the same date
        const existingAttendance = await prisma.attendanceStaff.findFirst({
            where: {
                staffId: validation.data.staffId,
                date: validation.data.date
            }
        });

        if (existingAttendance) {
            return res.status(400).json({
                message: "Attendance for this date has already been recorded."
            });
        }
        const adminId = await prisma.user.findUnique({
            where: {
                id: req.userId,                
            },
            });
        console.log(adminId)

        // Create attendance record
        const attendance = await prisma.attendanceStaff.create({
            data: {
                shift: validation.data.shift,
                date: validation.data.date,
                startTime: validation.data.startTime,
                endTime: validation.data.endTime,
                status: validation.data.status,
                staffId: validation.data.staffId,
                adminId: adminId.id
            },
            include: {
                staffDetails: {
                    include: {
                        User: true
                    },
                },
            },
        });

        res.status(200).json({ message: "Attendance created successfully", data: attendance });
    } catch (error) {
        next(error);
    }
};

// create bulk attendance for staff 

const createBulkAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN");
        // if (!admin) return res.status(401).json({ message: "User not authorized" });

        // Validate request body
        const validation = AttendanceSchema.parse(req.body);
        // if (!validation.success) {
        //     return res.status(400).json({
        //         error: "Invalid data format",
        //         issues: validation.error.issues.map((err) => err.message),
        //     });
        // }

        // Fetch staff details including dateOfJoining using staffId from params
        const staff = await prisma.staffDetails.findUnique({
            where: { id: req.params.staffId }, // Extract staffId from params
            select: { dateOfJoining: true }
        });

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        // Convert date strings to Date objects for comparison
        const dateOfJoining = new Date(staff.dateOfJoining);
        const currentDate = new Date();

        // Extract month and year from query parameters
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year are required" });
        }

        // Loop through the days of the month and create attendance for each day
        const startDate = new Date(year, month - 1, 1);  // Start date of the month
        const endDate = new Date(year, month, 0);  // End date of the month

        const attendanceRecords = [];
        for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
            const attendanceDate = new Date(date);
            attendanceDate.setHours(0, 0, 0, 0); // Normalize the date for comparison

            // Check if attendance date is before the staff's joining date
            if (attendanceDate < dateOfJoining) {
                continue; // Skip this date
            }

            // Check if attendance date is in the future
            if (attendanceDate > currentDate) {
                continue; // Skip this date
            }

            // Create attendance record for the date
            const attendance = await prisma.attendanceStaff.create({
                data: {
                    shift: validation.data.shift,
                    date: attendanceDate.toISOString().split('T')[0], // Convert to "YYYY-MM-DD"
                    startTime: validation.data.startTime,
                    endTime: validation.data.endTime,
                    status: validation.data.status,
                    staffId: req.params.staffId, // Use staffId from the URL parameter
                    adminId: req.userId // Use the logged-in user's adminId
                },
            });
            attendanceRecords.push(attendance);
        }

        res.status(200).json({ message: "Bulk attendance created successfully", data: attendanceRecords });

    } catch (error) {
        next(error);
    }
};




// end attendance time
const updateAttendanceEndTime = async (req, res, next) => {
    try {
        const { id: attendanceId } = req.params;
        const { endTime } = req.body;

        // Validate if endTime is provided
        if (!endTime) {
            return res.status(400).json({
                message: "End time is required to update attendance."
            });
        }

        // Check if attendance record exists
        const existingAttendance = await prisma.attendanceStaff.findUnique({
            where: { id: attendanceId }
        });

        if (!existingAttendance) {
            return res.status(404).json({
                message: "Attendance record not found."
            });
        }

        // Update only the endTime field
        const updatedAttendance = await prisma.attendanceStaff.update({
            where: { id: attendanceId },
            data: { endTime },
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
        const admin = checkAdmin(req.userId, "ADMIN", res);
        const { page, limit } = req.query;
        const attendance = await pagination(prisma.attendanceStaff, {
            page, limit,
            where: {
                adminId: admin.id
            },
            include: {
                staffDetails: {
                    include: {
                        User: true,
                    },
                },
                attendanceBreakRecord: true,
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
        // const admin = checkAdmin(req.userId, "ADMIN", res);
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
            },
            include: {
                staffDetails: {
                    include: {
                        User: true,
                    },
                },
                attendanceBreakRecord: true,
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
        const admin = checkAdmin(req.userId, "ADMIN", res);
        const { staffId } = req.params;
        const { month, year, page = 1, limit = 10 } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year are required" });
        }

        const existsStaffId = await prisma.staffDetails.findUnique({
            where: {
                id: staffId,
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
        // Validate request body
        const validation = AttendanceBreakRecordSchema.parse(req.body);
        const { startBreak, attendanceId, location, staffId, startBreakImage } = validation;
        console.log(req.file);
        // Ensure attendance exists
        const attendance = await prisma.attendanceStaff.findUnique({
            where: { id: attendanceId },
        });

        if (!attendance) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        // Check if attendance has already ended
        if (attendance.endTime) {
            return res.status(400).json({ message: "Cannot start break. Attendance has already ended." });
        }

        // Create break record with only startBreak
        const breakRecord = await prisma.attendanceBreakRecord.create({
            data: {
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
        const { endBreak } = req.body;

        if (!endBreak || !req.file) {
            return res.status(400).json({ message: "Break ID and End Break time are required" });
        }
        console.log("req.file");
        // Ensure break record exists
        const existingBreak = await prisma.attendanceBreakRecord.findUnique({
            where: { id: startBreakid },
        });

        if (!existingBreak) {
            return res.status(404).json({ message: "Break record not found" });
        }

        // Update break record with endBreak time
        const updatedBreak = await prisma.attendanceBreakRecord.update({
            where: { id: startBreakid },
            data: {
                endBreak,
                endBreakImage: req.file.path || null,
            },
        });

        res.status(200).json({ message: "Break ended successfully", data: updatedBreak });
    } catch (error) {
        next(error);
    }
};

export { createAttendance, getAllAttendance, getAttendanceByStaffId, updateAttendanceEndTime, startAttendanceBreak, endAttendanceBreak, getAttendanceByMonth, createBulkAttendance };