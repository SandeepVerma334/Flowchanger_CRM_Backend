import prisma from "../../../prisma/prisma.js";
import checkAdmin from "../../../utils/adminChecks.js";

const punchInStaff = async (req, res, next) => {
    try {
        const isStaff = await checkAdmin(req.userId, "STAFF");

        if (isStaff.error) {
            return res.status(403).json({ message: "You are not staff" });
        }

        const { date, punchInMethod, location, startTime } = req.body;

        const punchInPhoto = req.file.path ? req.file.path : null;
        const findAttendance = await prisma.attendanceStaff.findFirst({
            where: {
                staffId: isStaff.user.StaffDetails.id,
                date: date
            }
        })

        if (findAttendance) {
            return res.status(400).json({ message: "Staff has been punched in at " + findAttendance.date + " on " + findAttendance.startTime });
        }

        const attendance = await prisma.attendanceStaff.create({
            data: {
                startTime: startTime,
                date: date,
                status: "PRESENT",
                punchInMethod: punchInMethod,
                punchInLocation: location,
                punchInPhoto: punchInPhoto,
                staffDetails: {
                    connect: { id: isStaff.user.StaffDetails.id }
                },
                adminDetail: {
                    connect: { id: req.adminId }
                }
            },
            select: {
                id: true,
                shift: true,
                date: true,
                startTime: true,
                punchInMethod: true,
                punchInLocation: true,
                punchInPhoto: true
            }
        });
        res.status(200).json({ message: "Punch in successfully", data: attendance });
    }
    catch (err) {
        next(err);
    }
}
const punchOutStaff = async (req, res, next) => {
    try {
        const isStaff = await checkAdmin(req.userId, "STAFF");

        if (isStaff.error) {
            return res.status(403).json({ message: "You are not staff" });
        }

        const { date, punchOutMethod, location, endTime } = req.body;

        const punchOutPhoto = req?.files?.punchOutPhoto?.[0]?.path ? req?.files?.punchOutPhoto?.[0]?.path : null;

        const findAttendance = await prisma.attendanceStaff.findFirst({
            where: {
                staffId: isStaff.user.StaffDetails.id,
                date: date
            }
        })

        if (!findAttendance) {
            return res.status(400).json({ message: "Staff has not punch in first. " });
        }

        if (findAttendance.endTime) {
            return res.status(400).json({ message: "Staff has been punched out at " + findAttendance.date + " on " + findAttendance.endTime });
        }

        const attendance = await prisma.attendanceStaff.update({
            where: {
                id: findAttendance.id
            },
            data: {
                endTime: endTime,
                date: date,
                status: "PRESENT",
                punchOutMethod: punchOutMethod,
                punchOutLocation: location,
                punchOutPhoto: punchOutPhoto,

            },
            select: {
                id: true,
                shift: true,
                date: true,
                endTime: true,
                punchOutMethod: true,
                punchOutLocation: true,
                punchOutPhoto: true
            }
        });
        res.status(200).json({ message: "Punch out successfully", data: attendance });
    }
    catch (err) {
        next(err);
    }
}

const getPunchRecords = async (req, res, next) => {
    try {

        const { date } = req.params;
        const isStaff = await checkAdmin(req.userId, "STAFF");
        console.log(date)

        if (isStaff.error) {
            return res.status(403).json({ message: "You are not staff" });
        }


        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const punchRecords = await prisma.attendanceStaff.findFirst({
            where: {
                date: date,
                staffId: isStaff.user.StaffDetails.id,
                adminId: req.adminId
            },
            include: {
                fine: true,
                overTime: true
            }
        });

        if (!punchRecords) {
            return res.status(404).json({ message: "No punch record found" });
        }
        res.status(200).json({
            message: "Punch records successfully",
            data: punchRecords
        });
    }
    catch (err) {
        next(err);
    }
}


const startBreak = async (req, res, next) => {
    try {
        const isStaff = await checkAdmin(req.userId, "STAFF");

        if (isStaff.error) {
            return res.status(403).json({ message: "You are not staff" });
        }

        const startBreakPhoto = req?.files?.startBreakPhoto?.[0]?.path ? req?.files?.startBreakPhoto?.[0]?.path : null;


        const { startBreakLocation, attendanceId, startBreakTime, startBreakDate } = req.body;

        const findAttendance = await prisma.attendanceStaff.findUnique({
            where: {
                id: attendanceId
            }
        })

        if (!findAttendance) {
            return res.status(400).json({ message: "Staff has not punch in first" });
        }

        const attendance = await prisma.attendanceBreakRecord.create({
            data: {
                startBreakLocation,
                attendanceId,
                startBreakTime,
                startBreakDate,
                startBreakPhoto,
                staffDetails: {
                    connect: { id: isStaff.user.StaffDetails.id }
                },
                attendanceStaff: {
                    connect: { id: attendanceId }
                }
            },
            select: {
                id: true,
                startBreakPhoto: true,
                startBreakLocation: true,
                startBreakTime: true,
                startBreakDate: true,


            }
        });
        res.status(200).json({ message: "Punch in successfully", data: attendance });
    }
    catch (err) {
        next(err);
    }
}

const endBreak = async (req, res, next) => {
    try {
        const isStaff = await checkAdmin(req.userId, "STAFF");

        if (isStaff.error) {
            return res.status(403).json({ message: "You are not staff" });
        }

        const { endBreakLocation, attendanceId, endBreakTime, endBreakDate } = req.body;
        const endBreakPhoto = req?.files?.startBreakPhoto?.[0]?.path ? req?.files?.startBreakPhoto?.[0]?.path : null;

        const findAttendance = await prisma.attendanceStaff.findUnique({
            where: {
                id: attendanceId
            }
        })

        if (!findAttendance) {
            return res.status(400).json({ message: "Staff has not punch in first" });
        }

        const attendance = await prisma.attendanceBreakRecord.create({
            data: {
                endBreakLocation,
                attendanceId,
                endBreakTime,
                endBreakDate,
                endBreakPhoto,
                staffDetails: {
                    connect: { id: isStaff.user.StaffDetails.id }
                },
                attendanceStaff: {
                    connect: { id: attendanceId }
                }
            },
            select: {
                id: true,
                endBreakTime: true,
                endBreakDate: true,
                endBreakLocation: true,
                endBreakPhoto: true,
            }
        });
        res.status(200).json({ message: "Punch in successfully", data: attendance });
    }
    catch (err) {
        next(err);
    }
}
// const endBreak = async (req, res, next) => {
//     try {
//         const isStaff = await checkAdmin(req.userId, "STAFF");

//         if (isStaff.error) {
//             return res.status(403).json({ message: "You are not staff" });
//         }

//         const { endBreakLocation, endbreakPhoto, endBreakTime, endBreakDate } = req.body;

//         const punchOutPhoto = req?.files?.punchOutPhoto?.[0]?.path ? req?.files?.punchOutPhoto?.[0]?.path : null;

//         const findAttendance = await prisma.attendanceStaff.findFirst({
//             where: {
//                 staffId: isStaff.user.StaffDetails.id,
//                 date: date
//             }
//         })

//         if (!findAttendance) {
//             return res.status(400).json({ message: "Staff has not punch in first. " });
//         }

//         if (findAttendance.endTime) {
//             return res.status(400).json({ message: "Staff has been punched out at " + findAttendance.date + " on " + findAttendance.endTime });
//         }

//         const attendance = await prisma.attendanceStaff.update({
//             where: {
//                 id: findAttendance.id
//             },
//             data: {
//                 endTime: endTime,
//                 date: date,
//                 status: "PRESENT",
//                 punchOutMethod: punchOutMethod,
//                 punchOutLocation: location,
//                 punchOutPhoto: punchOutPhoto,

//             },
//             select: {
//                 id: true,
//                 shift: true,
//                 date: true,
//                 endTime: true,
//                 punchOutMethod: true,
//                 punchOutLocation: true,
//                 punchOutPhoto: true
//             }
//         });
//         res.status(200).json({ message: "Punch out successfully", data: attendance });
//     }
//     catch (err) {
//         next(err);
//     }
// }

export { punchInStaff, punchOutStaff, getPunchRecords, startBreak, endBreak };