import { AttendanceSchema, AttendanceBreakRecordSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";
import { late, string } from "zod";
import { stat } from "fs";
import { create } from "domain";
// const cron = require('node-cron');

const calculatePerMinuteSalary = (ctcAmount, date, workingHoursPerDay) => {
    const givenDate = new Date(date);
    const year = givenDate.getFullYear();
    const month = givenDate.getMonth(); // 0-based (Jan = 0, Feb = 1, etc.)

    // Get total days in the given month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    console.log(" days in month ", daysInMonth);
    // const workingHoursPerDay = 8;

    // Calculate daily salary
    const dailySalary = ctcAmount / daysInMonth;

    // Calculate per hour & per minute salary
    const perHourSalary = dailySalary / workingHoursPerDay;
    const perMinuteSalary = perHourSalary / 60;

    return perMinuteSalary;
};


// const calculatePerMinuteSalary = (ctcAmount, date, workingHoursPerDay) => {
//     const givenDate = new Date(date);
//     const year = givenDate.getFullYear();
//     const month = givenDate.getMonth(); // 0-based (Jan = 0, Feb = 1, etc.)

//     // Get total days in the given month
//     const daysInMonth = new Date(year, month + 1, 0).getDate();
//     console.log(" days in month ", daysInMonth);
//     // const workingHoursPerDay = 8;

//     // Calculate daily salary
//     const dailySalary = ctcAmount / daysInMonth;

//     // Calculate per hour & per minute salary
//     const perHourSalary = dailySalary / workingHoursPerDay;
//     const perMinuteSalary = perHourSalary / 60;

//     return perMinuteSalary;
// };


function convertMinutesToTimeFormat(totalMinutes) {
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function convertTimeFormatToMinutes(timeString) {
    let [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
}

function convertTo24HourFormat(time) {
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) {
        hours += 12;
    } else if (modifier === "AM" && hours === 12) {
        hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

function calculateWorkedHours(startTime, endTime) {
    function parseTimeToMinutes(time) {
        if (!time || typeof time !== "string") {
            return 0; // Default to 0 minutes if time is null/undefined/invalid
        }

        const match = time.match(/(\d+):(\d+) (AM|PM)/);
        if (!match) {
            return 0; // Return 0 if format is incorrect
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

// Function to delete overtime by staffId and date
async function deleteOvertime(prisma, staffId, date) {
    try {
        const findOvertime = await prisma.overtime.findFirst({
            where: { staffId: staffId, date: date }
        });

        if (findOvertime) {
            await prisma.overtime.delete({
                where: { id: findOvertime.id },
            });
            console.log(`Overtime record deleted for staffId: ${staffId} on ${date}`);
        }
    } catch (error) {
        console.error("Error deleting overtime:", error);
    }
}

// Function to delete fine by staffId and date
async function deleteFine(prisma, staffId, date) {
    try {
        const findFine = await prisma.fine.findFirst({
            where: { staffId: staffId, date: date }
        });

        if (findFine) {
            await prisma.fine.delete({
                where: { id: findFine.id }
            });
            console.log(`Fine record deleted for staffId: ${staffId} on ${date}`);
        }
    } catch (error) {
        console.error("Error deleting fine:", error);
    }
}

const createAttendance = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        let { staffId, shift, date, startTime, endTime, status } = req.body;
        // Extract year, month, and day from the given date
        const [year, month, day] = date.split('-').map(Number);

        // Get the number of days in the given month
        const daysInMonth = new Date(year, month, 0).getDate();

        // Validate that the day is within the allowed range
        if (day > daysInMonth) {
            return res.status(400).json({ message: `Invalid date: ${year}-${month}-${day}. This month has only ${daysInMonth} days.` });
        }
        // console.log(shift);
        let officeWorkingHours = admin.user.adminDetails.officeWorkinghours;
        const officeStartTime = admin.user.adminDetails.officeStartTime;
        const officeEndtime = admin.user.adminDetails.officeEndtime;
        let PerMinuteSalary;

        if (officeStartTime && officeEndtime) {
            officeWorkingHours = calculateWorkedHours(officeStartTime, officeEndtime);
        }

        // Fetch staff details including dateOfJoining
        const staff = await prisma.staffDetails.findFirst({
            where: { id: staffId, adminId: admin.user.adminDetails.id },
            select: { dateOfJoining: true }
        });

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }
        console.log(date)
        // Convert date strings to Date objects for comparison
        const dateOfJoining = new Date(staff.dateOfJoining);
        const attendanceDate = new Date(date);
        const currentDate = new Date();

        dateOfJoining.setHours(0, 0, 0, 0);
        if (attendanceDate < dateOfJoining) {
            return res.status(400).json({ message: "Attendance cannot be marked before the date of joining." });
        }
        // console.log(attendanceDate, currentDate)
        if (attendanceDate > currentDate) {
            return res.status(400).json({ message: "Attendance cannot be marked for a future date." });
        }

        let attendanceStatus = status.trim().toUpperCase();

        if (!["ABSENT", "HALF_DAY", "PAID_LEAVE", "PRESENT", "WEEK_OFF"].includes(attendanceStatus)) {
            return res.status(400).json({ message: "Invalid status provided." });
        }

        // console.log(attendanceDate.getDay())
        if (attendanceDate.getDay() == 0) {
            attendanceStatus = "WEEK_OFF";
        } else {
            attendanceStatus = status.trim();
            if (!["ABSENT", "HALF_DAY", "PAID_LEAVE", "PRESENT", "WEEK_OFF"].includes(status)) {
                return res.status(400).json({ message: "Invalid status provided." });
            }
        }

        // console.log(attendanceStatus)
        let existingAttendance = await prisma.attendanceStaff.findFirst({
            where: { staffId: staffId, date: date }
        });
        let attendanceEntry;

        if (existingAttendance) {
            attendanceEntry = await prisma.attendanceStaff.update({
                where: { id: existingAttendance.id },
                data: { status: attendanceStatus, startTime, endTime, shift }
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

        // console.log(attendanceEntry)
        if (attendanceEntry && status !== "PRESENT") {

            await deleteFine(prisma, staffId, date);
            await deleteOvertime(prisma, staffId, date)

            console.log("Updated Attendance Entry:", attendanceEntry);
        } else {
            console.log("New Attendance Entry:", attendanceEntry);
        }
        if (attendanceEntry && status === "PRESENT") {
            // Proceed with Fine Calculation after creating or updating the attendance entry

            console.log(startTime === "" ? "00:00" : startTime, endTime !== "" ? endTime : "00:00", date)
            const workedHours = calculateWorkedHours(startTime === "" ? "00:00" : startTime, endTime !== "" ? endTime : "00:00", date);;
            const salaryDetails = await prisma.salaryDetail.findFirst({
                where: { staffId: staffId, },
                orderBy: { createdAt: "desc" }
            });
            const monthDays = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth() + 1, 0).getDate();
            let ctcAmount = 0;
            if (salaryDetails) {
                ctcAmount = salaryDetails.ctcAmount;
            }
            const perDaySalary = ctcAmount / monthDays;
            const perHourSalary = perDaySalary / officeWorkingHours;
            const officeStart = convertTo24HourFormat(officeStartTime || "00:00");
            const officeEnd = convertTo24HourFormat(officeEndtime || "00:00");
            const staffStart = convertTo24HourFormat(startTime || "00:00");
            const staffEnd = convertTo24HourFormat(endTime || "00:00");
            console.log(staffStart);
            console.log(staffEnd)
            let LateCommingTime = 0;
            let EarlyCommingTime = 0;
            let EarlyOutOffice = 0;
            let LateOutOffice = 0;



            function getTimeDifference(start, end) {
                let [startHours, startMinutes] = start.split(":").map(Number);
                let [endHours, endMinutes] = end.split(":").map(Number);

                let startTotalMinutes = startHours * 60 + startMinutes;
                let endTotalMinutes = endHours * 60 + endMinutes;

                let diffInMinutes = Math.abs(endTotalMinutes - startTotalMinutes);
                let hours = Math.floor(diffInMinutes / 60);
                let minutes = diffInMinutes % 60;

                return { hours, minutes, totalMinutes: diffInMinutes };
            }

            // Initialize variables

            let totalTime;
            let totalFineTime;
            let totalOvertimeTime;


            if (officeStartTime && officeEndtime) {

                // Staff Late or Early Arrival Calculation
                if (staffStart > officeStart) {
                    let diff = getTimeDifference(officeStart, staffStart);
                    LateCommingTime = diff.totalMinutes;
                } else if (staffStart < officeStart) {
                    let diff = getTimeDifference(staffStart, officeStart);
                    EarlyCommingTime = diff.totalMinutes;
                }

                // Staff Early or Late Departure Calculation
                if (staffEnd < officeEnd) {
                    let diff = getTimeDifference(staffEnd, officeEnd);
                    EarlyOutOffice = diff.totalMinutes;
                } else if (staffEnd > officeEnd) {
                    let diff = getTimeDifference(officeEnd, staffEnd);
                    LateOutOffice = diff.totalMinutes;
                }

                if (EarlyCommingTime !== 0 && EarlyOutOffice !== 0) {
                    EarlyOutOffice = EarlyOutOffice - EarlyCommingTime;
                    EarlyCommingTime = 0
                }

                if (LateCommingTime !== 0 && LateOutOffice !== 0) {
                    LateOutOffice = LateOutOffice - LateCommingTime;
                    LateCommingTime = 0
                }

            }


            else {
                const totalWorkedTime = getTimeDifference(staffStart, staffEnd);
                if (totalWorkedTime.totalMinutes < officeWorkingHours * 60) {
                    totalFineTime = officeWorkingHours * 60 - totalWorkedTime.totalMinutes;
                } else if (totalWorkedTime.totalMinutes > officeWorkingHours * 60) {
                    console.log("totalWorkedTime.totalMinutes", totalWorkedTime.totalMinutes)
                    console.log("officeWorkingHours * 60", officeWorkingHours * 60)
                    totalOvertimeTime = totalWorkedTime.totalMinutes - officeWorkingHours * 60;
                }
            }

            console.log("LateCommingTime", LateCommingTime);
            console.log("EarlyCommingTime", EarlyCommingTime);
            console.log("EarlyOutOffice", EarlyOutOffice);
            console.log("LateOutOffice", LateOutOffice);


            PerMinuteSalary = perHourSalary / 60;
            const LateCommingFine = PerMinuteSalary * LateCommingTime;
            const EarlyOutFine = PerMinuteSalary * EarlyOutOffice;

            console.log("EarlyComing", EarlyCommingTime)
            let OvertimeMinutes;
            let OvertimePay;
            let earlyCommingOvertime;
            let lateOutOvertime;
            let totalOvertimePay;

            // Overtime Calculation (if staff worked extra)
            OvertimeMinutes = LateOutOffice + EarlyCommingTime;
            OvertimePay = PerMinuteSalary * OvertimeMinutes;
            earlyCommingOvertime = EarlyCommingTime * PerMinuteSalary;
            lateOutOvertime = LateOutOffice * PerMinuteSalary;
            totalOvertimePay = earlyCommingOvertime + lateOutOvertime;




            // console.log(OvertimeMinutes, OvertimePay, earlyCommingOvertime, lateOutOvertime, totalOvertimePay);
            let TotalFine = LateCommingFine + EarlyOutFine;
            console.log(LateCommingFine, EarlyOutFine, TotalFine)

            if (salaryDetails) {
                if (workedHours < officeWorkingHours) {

                    // console.log("sldjfldsjfklsd");
                    const missingHours = officeWorkingHours - workedHours;
                    const fineAmount = missingHours * perHourSalary;

                    await deleteOvertime(prisma, staffId, date);

                    // const findOvertime = await prisma.overtime.findFirst({
                    //     where: { staffId: staffId, date: date }
                    // })

                    // if (findOvertime) {
                    //     await prisma.overtime.delete({
                    //         where: { id: findOvertime.id },
                    //     })
                    // }

                    // start to get fine or overtime time calculation 

                    // Per minute salary calculation

                    // Logging the results
                    // console.log("staffStart:", staffStart, "staffEnd:", staffEnd, "officeStart:", officeStart, "officeEnd:", officeEnd);
                    // console.log("LateCommingTime (mins):", LateCommingTime, "Fine:", LateCommingFine.toFixed(2));
                    // console.log("EarlyOutOffice (mins):", EarlyOutOffice, "Fine:", EarlyOutFine.toFixed(2));
                    // console.log("Total Fine:", TotalFine);
                    // console.log("Overtime (mins):", OvertimeMinutes, "Overtime Pay:", OvertimePay.toFixed(2));
                    // console.log(convertMinutesToTimeFormat(LateCommingTime))

                    // Check if fine entry already exists
                    let existingFine = await prisma.fine.findFirst({
                        where: { staffId: staffId }
                    });

                    console.log("existing fine", existingFine);

                    if (existingFine) {
                        console.log("it runs")
                        console.log(EarlyOutOffice, LateCommingTime);
                        // Update fine entry
                        await prisma.fine.update({
                            where: { id: existingFine.id },
                            data: {
                                lateEntryFineHoursTime: convertMinutesToTimeFormat(LateCommingTime),
                                lateEntryFineAmount: 1,
                                lateEntryAmount: parseFloat(LateCommingFine.toFixed(2)),
                                earlyOutFineHoursTime: convertMinutesToTimeFormat(EarlyOutOffice),
                                earlyOutFineAmount: 1,
                                earlyOutAmount: parseFloat(EarlyOutFine.toFixed(2)),
                                totalAmount: parseFloat((TotalFine ? TotalFine : totalFineTime * PerMinuteSalary).toFixed(2)),
                                date: date,
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

                                lateEntryFineHoursTime: convertMinutesToTimeFormat(LateCommingTime),
                                lateEntryFineAmount: 1,
                                lateEntryAmount: parseFloat(LateCommingFine.toFixed(2)),
                                earlyOutFineHoursTime: convertMinutesToTimeFormat(EarlyOutOffice),
                                earlyOutFineAmount: 1,
                                earlyOutAmount: parseFloat(EarlyOutFine.toFixed(2)),
                                totalAmount: parseFloat((TotalFine ? TotalFine : totalFineTime * PerMinuteSalary).toFixed(2)),
                                // lateEntryFineHoursTime: formatHoursToTime(missingHours),
                                date: date,
                            }
                        });
                        console.log("Fine created");
                    }
                }
                else if (workedHours > officeWorkingHours) {
                    // console.log("Office Working Hours:", officeWorkingHours);
                    // console.log("Worked Hours:", workedHours);

                    // console.log("office Start", officeStart);
                    // console.log("office END", officeEnd);
                    // console.log("per minut salary", PerMinuteSalary);
                    // console.log("EarlyCommingTime", EarlyCommingTime);
                    // console.log("earlyCommingOvertime ", earlyCommingOvertime);
                    // console.log("LateOutOffice", LateOutOffice);
                    // console.log("lateOutOvertime", lateOutOvertime);
                    // console.log("OvertimeMinutes", OvertimeMinutes);
                    // console.log("OvertimePay", OvertimePay);
                    // const findFine = await prisma.fine.findFirst({
                    //     where: {
                    //         staffId: staffId,
                    //         date: date
                    //     }
                    // })

                    // if (findFine) {
                    //     await prisma.fine.delete({
                    //         where: {
                    //             id: findFine.id
                    //         }
                    //     })
                    // }
                    await deleteFine(prisma, staffId, date);

                    const overtimeHours = workedHours - officeWorkingHours;
                    const totalOvertimeAmount = Number(perHourSalary) * Number(overtimeHours);
                    let existingOvertime = await prisma.overtime.findFirst({ where: { staffId: staffId, date: date } });
                    if (existingOvertime) {
                        await prisma.overtime.update({
                            where: { id: existingOvertime.id },
                            data: {
                                adminId: admin.user.adminDetails.id,
                                earlyCommingEntryHoursTime: convertMinutesToTimeFormat(EarlyCommingTime),
                                // earlyCommingEntryAmoun   t,
                                earlyEntryAmount: parseFloat(earlyCommingOvertime.toFixed(2)),
                                // lateOutOvertimeHoursTime: formatHoursToTime(overtimeHours),
                                lateOutOvertimeHoursTime: convertMinutesToTimeFormat(LateOutOffice),
                                // lateOutOvertimeAmount,
                                lateOutAmount: parseFloat(lateOutOvertime.toFixed(2)),
                                date: date,
                                totalAmount: parseFloat((totalOvertimePay ? totalOvertimePay : totalOvertimeTime * PerMinuteSalary).toFixed(2)),
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
                                ...(salaryDetails && {
                                    SalaryDetail: {
                                        connect: {
                                            id: salaryDetails.id
                                        }
                                    }
                                }),
                                adminId: admin.user.adminDetails.id,
                                earlyCommingEntryHoursTime: convertMinutesToTimeFormat(EarlyCommingTime),
                                // earlyCommingEntryAmount: parseFloat(earlyCommingOvertime.toFixed(2)),
                                earlyEntryAmount: parseFloat(earlyCommingOvertime.toFixed(2)),
                                // lateOutOvertimeHoursTime: formatHoursToTime(overtimeHours),
                                lateOutOvertimeHoursTime: convertMinutesToTimeFormat(LateOutOffice),
                                // lateOutOvertimeAmount: parseFloat(lateOutOvertime.toFixed(2)),
                                lateOutAmount: parseFloat(lateOutOvertime.toFixed(2)),
                                date: date,
                                totalAmount: parseFloat((totalOvertimePay ? totalOvertimePay : totalOvertimeTime * PerMinuteSalary).toFixed(2)),
                            }
                        });
                    }
                }
                else {
                    await deleteOvertime(prisma, staffId, date);
                    await deleteFine(prisma, staffId, date);

                }
            }
        }
        res.status(200).json({
            message: existingAttendance ? "Attendance updated successfully" : "Attendance created successfully",
            data: attendanceEntry,
            perMinutSalary: PerMinuteSalary,
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

        const { page, limit } = req.query; // Only paginations params, no date

        const attendance = await pagination(prisma.user, {
            page, limit,
            where: {
                adminId: req.userId,
                role: "STAFF",
            },
            include: {
                StaffDetails: {
                    include: {
                        AttendanceStaff: {
                            include: {
                                fine: true,
                                overTime: true,
                            }
                        },
                    },
                },
            },
        });

        res.status(200).json({
            message: "Attendance fetched successfully",
            data: attendance.data, // No filtering, full data
            totalData: attendance.totalData,
            totalPages: attendance.totalPages,
            currentPages: attendance.currentPage
        });
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

// get single staff all attendance by id for by month
const getAllAttendanceByMinthForStaffId = async (req, res, next) => {
    try {
        const staff = await checkAdmin(req.userId, "STAFF", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }
        const { page, limit } = req.query;
        const { staffId } = req.params;
        if (!staffId) {
            return res.status(400).json({ message: "staffId is required" });
        }
        // ldkjfdslk
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
        const { staffId, type } = req.params;

        if (!type) {
            return res.status(400).json({ message: "type is required as STAFF or ADMIN" });
        }

        const admin = await checkAdmin(req.userId, type, res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }

        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(400).json({ message: "Month and Year are required" });
        }

        const existsStaffId = await prisma.staffDetails.findFirst({
            where: {
                id: staffId,
                adminId: type === "ADMIN" ? admin.user.adminDetails.id : req.adminId
            },
        });
        if (!existsStaffId) {
            return res.status(404).json({ message: "Staff not found" });
        }

        const staff = await prisma.staffDetails.findFirst({
            where: { id: staffId, adminId: admin.user.adminDetails.id },
            select: { dateOfJoining: true }
        });

        // Convert date strings to Date objects for comparison
        const dateOfJoining = new Date(staff.dateOfJoining);
        const currentDate = new Date();

        // Ensure month and year are numbers
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);

        // Fetch attendance data for the specific month
        const startDate = `${yearNum}-${monthNum.toString().padStart(2, "0")}-01`;
        const endDate = new Date(yearNum, monthNum, 0).getDate(); // Get last day of the month
        const endDateString = `${yearNum}-${monthNum.toString().padStart(2, "0")}-${endDate}`;

        // Fetch all existing attendance for the given staffId between start and end date
        const existingAttendances = await prisma.attendanceStaff.findMany({
            where: {
                staffId: staffId,
                adminId: type === "ADMIN" ? admin.user.adminDetails.id : req.adminId,
                date: {
                    gte: startDate,
                    lte: endDateString,
                },
            },
        });

        // Create attendance records for all missing dates
        let currentDay = new Date(startDate); // Start from the 1st day of the requested month
        while (currentDay <= currentDate && currentDay <= new Date(endDateString)) {
            const formattedDate = currentDay.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

            // If the staff member's joining date is later than the current date, skip it
            if (new Date(staff.dateOfJoining) > currentDay) {
                currentDay.setDate(currentDay.getDate() + 1); // Move to the next day
                continue;
            }

            // Check if attendance already exists for the current date
            const existingAttendance = existingAttendances.find(attendance => attendance.date === formattedDate);

            if (!existingAttendance) {
                // If no attendance exists for this date, create a new record
                const dayOfWeek = currentDay.getDay(); // 0 for Sunday, 1 for Monday, etc.
                let status = "ABSENT"; // Default status is 'ABSENT'

                // If the day is Sunday, set the status to 'WEEK_OFF'
                if (dayOfWeek === 0) {
                    status = "WEEK_OFF";
                }

                // Create a new attendance record
                await prisma.attendanceStaff.create({
                    data: {
                        staffId: staffId,
                        adminId: admin.user.adminDetails.id,
                        date: formattedDate,
                        status: status,
                    },
                });
                console.log(`Created attendance for ${formattedDate} with status ${status}`);
            }

            // Move to the next day
            currentDay.setDate(currentDay.getDate() + 1);
        }

        // After ensuring attendance is created, now fetch the attendance records for the requested month
        const attendanceRecords = await prisma.attendanceStaff.findMany ({
            where: {
                staffId: staffId,
                adminId: type === "ADMIN" ? admin.user.adminDetails.id : req.adminId,
                date: {
                    gte: startDate,
                    lte: endDateString,
                },
            },
            orderBy: {
                date: "asc",
            },
        });
        console.log("attendanceRecords " , attendanceRecords);
        // Count the attendance status types for the requested month
        const statusCounts = {
            PRESENT: 0,
            WEEK_OFF: 0,
            PAID_LEAVE: 0,
            HALF_DAY: 0,
            ABSENT: 0,
        };

        attendanceRecords?.forEach(record => {
            if (record.status === "PRESENT") statusCounts.PRESENT++;
            if (record.status === "WEEK_OFF") statusCounts.WEEK_OFF++;
            if (record.status === "PAID_LEAVE") statusCounts.PAID_LEAVE++;
            if (record.status === "HALF_DAY") statusCounts.HALF_DAY++;
            if (record.status === "ABSENT") statusCounts.ABSENT++;
        });

        res.status(200).json({
            message: "Attendance records fetched successfully",
            attendanceRecords,
            statusCounts: statusCounts, // Include the count of each status type
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

        let officeWorkingHours = admin.user.adminDetails.officeWorkinghours;
        const officeStartTime = admin.user.adminDetails.officeStartTime;
        const officeEndtime = admin.user.adminDetails.officeEndtime;

        if (officeStartTime && officeEndtime) {
            officeWorkingHours = calculateWorkedHours(officeStartTime, officeEndtime);
        }


        const attendance = await pagination(prisma.user, {
            page, limit,
            where: {
                adminId: req.userId,
                role: "STAFF",
            },
            include: {
                StaffDetails: {
                    include: {
                        SalaryDetails: true,
                        AttendanceStaff: {
                            include: {
                                fine: true,
                                overTime: true,

                            }
                        },
                    },
                },
                // attendanceBreakRecord: true,
                // fine: true
            },
        });
        console.log(formattedDate);
        res.status(200).json({
            message: "Attendance fetched successfully", data: attendance.data.map((staff) => ({
                ...staff,
                StaffDetails: {
                    ...staff.StaffDetails,
                    perMinSalary: calculatePerMinuteSalary(staff?.StaffDetails?.SalaryDetails[staff?.StaffDetails?.SalaryDetails?.length - 1]?.ctcAmount || 0, date, officeWorkingHours),
                    AttendanceStaff: staff.StaffDetails.AttendanceStaff.filter(
                        (attendance) => attendance.date === formattedDate
                    ),
                },
            }))
            , totalData: attendance.totalData, totalPages: attendance.totalPages, currentPages: attendance.currentPage
        });
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

            let effectiveStatus = status || "PRESENT";
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


const countStaffAttendance = async (req, res, next) => {
    try {
        const { date } = req.params;
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const allStaff = await prisma.staffDetails.findMany({
            where: { adminId: admin.user.adminDetails.id },
            select: {
                AttendanceStaff: {
                    where: { date },
                    select: {
                        status: true,
                        fine: true,
                        overTime: true
                    }
                }
            }
        });

        let totalPresent = 0;
        let totalAbsent = 0;
        let totalPaidLeave = 0;
        let totalHalfDay = 0;
        let totalFineMinutes = 0;
        let totalOvertimeMinutes = 0;

        if (!allStaff || allStaff.length === 0) {
            return res.status(400).json({
                message: "No staff found.", data: {
                    totalStaff: allStaff.length,
                    totalPresent,
                    totalAbsent,
                    totalPaidLeave,
                    totalHalfDay,
                    totalFineTime: 0,
                    totalOvertimeTime: 0,
                }
            });
        }


        allStaff.forEach(staff => {
            staff.AttendanceStaff.forEach(attendance => {
                // Count different statuses
                switch (attendance.status) {
                    case "PRESENT":
                        totalPresent++;
                        break;
                    case "ABSENT":
                        totalAbsent++;
                        break;
                    case "PAID_LEAVE":
                        totalPaidLeave++;
                        break;
                    case "HALF_DAY":
                        totalHalfDay++;
                        break;
                }

                // Accumulate total fine minutes
                if (attendance.fine && Array.isArray(attendance.fine)) {
                    attendance.fine.forEach(fine => {
                        if (fine.lateEntryFineHoursTime) {
                            totalFineMinutes += convertTimeFormatToMinutes(fine.lateEntryFineHoursTime);
                        }
                        if (fine.excessBreakFineHoursTime) {
                            totalFineMinutes += convertTimeFormatToMinutes(fine.excessBreakFineHoursTime);
                        }
                        if (fine.earlyOutFineHoursTime) {
                            totalFineMinutes += convertTimeFormatToMinutes(fine.earlyOutFineHoursTime);
                        }
                    });
                }

                // Accumulate total overtime minutes
                if (attendance.overTime && Array.isArray(attendance.overTime)) {
                    attendance.overTime.forEach(overtime => {
                        if (overtime.overtimeHoursTime) {
                            totalOvertimeMinutes += convertTimeFormatToMinutes(overtime.overtimeHoursTime);
                        }
                        if (overtime.earlyCommingEntryHoursTime) {
                            totalOvertimeMinutes += convertTimeFormatToMinutes(overtime.earlyCommingEntryHoursTime);
                        }
                    });
                }
            });
        });

        res.status(200).json({
            message: "Attendance count fetched successfully",
            data: {
                totalStaff: allStaff.length,
                totalPresent,
                totalAbsent,
                totalPaidLeave,
                totalHalfDay,
                totalFineTime: parseFloat((totalFineMinutes / 60).toFixed(2)),
                totalOvertimeTime: parseFloat((totalOvertimeMinutes / 60).toFixed(2)),
            }
        });
    } catch (error) {
        next(error);
    }
};

export {
    createAttendance, getAllAttendance, getAttendanceByStaffId, startAttendanceBreak, createBulkAttendance, countStaffAttendance,
    endAttendanceBreak, getAttendanceByMonth, halfDayAttendance, getAllAttendanceByDate, getAllStartBreakRecord, getAllEndBreakRecord
}
