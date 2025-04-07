import prisma from "../../../prisma/prisma.js";
import checkAdmin from "../../../utils/adminChecks.js";

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
function getTimeDifference(start, end) {
    let [startHours, startMinutes] = start.split(":").map(Number);
    let [endHours, endMinutes] = end.split(":").map(Number);

    let startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    let diffInMinutes = endTotalMinutes - startTotalMinutes;
    let hours = Math.floor(diffInMinutes / 60);
    let minutes = diffInMinutes % 60;

    return { hours, minutes, totalMinutes: diffInMinutes };
}
function calculateWorkedHours(startTime, endTime) {
    function parseTimeToMinutes(time) {
        if (!time) return null;

        // Regular expression to match time format "HH:MM AM/PM"
        const timeMatch = time.match(/(\d+):(\d+)\s+(AM|PM)/i);
        if (!timeMatch) return null;

        let [_, hour, minute, period] = timeMatch;
        hour = parseInt(hour, 10);
        minute = parseInt(minute, 10);

        // Convert to 24-hour format
        period = period.toUpperCase();
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return hour * 60 + minute; // Total minutes from midnight
    }

    let startMinutes = parseTimeToMinutes(startTime);
    let endMinutes = parseTimeToMinutes(endTime);

    if (startMinutes === null || endMinutes === null) {
        return 0;
    }

    if (endMinutes < startMinutes) {
        // If endTime is earlier than startTime, assume endTime is the next day
        endMinutes += 24 * 60;
    }

    let workedMinutes = endMinutes - startMinutes;
    let workedHours = workedMinutes / 60;

    return workedHours;
}

function calculateDetailedTimeMetrics(params) {
    const {
        punchInTime,
        punchOutTime,
        officeStartTime,
        officeEndTime,
        breakStartTime,
        breakEndTime,
        allowedBreakHours = 0
    } = params;

    // Calculate total worked hours (from punch-in to punch-out)
    const totalWorkedHours = calculateWorkedHours(punchInTime, punchOutTime);

    // Calculate break duration if break times are provided
    let breakHours = 0;
    if (breakStartTime && breakEndTime) {
        breakHours = calculateWorkedHours(breakStartTime, breakEndTime);
    }

    // Calculate effective work hours (total worked minus break)
    const effectiveWorkHours = totalWorkedHours - breakHours;

    let officeWorkingHours = 0,
        LateCommingTime = 0,
        EarlyCommingTime = 0,
        EarlyOutOffice = 0,
        LateOutOffice = 0;


    if (officeStartTime && officeEndTime) {
        officeWorkingHours = calculateWorkedHours(officeStartTime, officeEndTime);

        const punchIn = convertTo24HourFormat(punchInTime);
        const punchOut = convertTo24HourFormat(punchOutTime);
        const officeStart = convertTo24HourFormat(officeStartTime);
        const officeEnd = convertTo24HourFormat(officeEndTime);
        const diffPunchOutOfficeEnd = getTimeDifference(punchOut, officeEnd).totalMinutes;
        const diffPunchInOfficeStart = getTimeDifference(officeStart, punchIn).totalMinutes;

        // Staff Late or Early Arrival Calculation
        if (diffPunchInOfficeStart > 0) {
            LateCommingTime = diffPunchInOfficeStart;
        } else if (diffPunchInOfficeStart < 0) {
            EarlyCommingTime = Math.abs(diffPunchInOfficeStart);
        }


        // Staff Early or Late Departure Calculation
        if (diffPunchOutOfficeEnd > 0) {
            EarlyOutOffice = diffPunchOutOfficeEnd;
        } else if (diffPunchOutOfficeEnd < 0) {
            LateOutOffice = Math.abs(diffPunchOutOfficeEnd);
        }

        if (EarlyOutOffice > EarlyCommingTime) {
            EarlyOutOffice -= EarlyCommingTime;
            EarlyCommingTime = 0;
        }
        else {
            EarlyCommingTime -= EarlyOutOffice;
            EarlyOutOffice = 0;
        }

        if (LateOutOffice > LateCommingTime) {
            LateOutOffice -= LateCommingTime;
            LateCommingTime = 0;
        }
        else {
            LateCommingTime -= LateOutOffice;
            LateOutOffice = 0;
        }


    }
    // Calculate excess break hours
    let excessBreakHours = 0;
    if (breakHours > allowedBreakHours) {
        excessBreakHours = breakHours - allowedBreakHours;
    }

    return {
        totalWorkedHours,
        breakHours,
        effectiveWorkHours,
        LateCommingTime: Math.abs(LateCommingTime),
        EarlyCommingTime: Math.abs(EarlyCommingTime),
        EarlyOutOffice: Math.abs(EarlyOutOffice),
        LateOutOffice: Math.abs(LateOutOffice),
        excessBreakHours: Math.abs(excessBreakHours),
    };
}

async function calculateOvertimeAndFine(staffId, attendanceId, startTime, endTime, date, adminId, breakStartTime = null, breakEndTime = null) {
    try {
        // Input validation for time formats
        const timeRegex = /^\d{1,2}:\d{2}\s+(AM|PM)$/i;

        if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
            console.error("Invalid time format. Expected format: HH:MM AM/PM");
            return {
                success: false,
                error: "Invalid time format. Expected format: HH:MM AM/PM"
            };
        }

        if (breakStartTime && !timeRegex.test(breakStartTime) ||
            breakEndTime && !timeRegex.test(breakEndTime)) {
            console.error("Invalid break time format. Expected format: HH:MM AM/PM");
            return {
                success: false,
                error: "Invalid break time format. Expected format: HH:MM AM/PM"
            };
        }

        // Fetch salary details for the staff
        const salaryDetails = await prisma.salaryDetail.findFirst({
            where: { staffId: staffId }
        });

        if (!salaryDetails) {
            return {
                success: false,
                error: "No salary details found for staff"
            };
        }

        // Fetch admin details to get office working hours
        const adminDetails = await prisma.adminDetails.findFirst({
            where: { id: adminId }
        });

        if (!adminDetails) {
            return {
                success: false,
                error: "No admin details found for admin"
            };
        }

        // Get office times and ensure they're in the correct format
        const officeStartTime = adminDetails.officeStartTime;
        const officeEndTime = adminDetails.officeEndtime;

        if (!timeRegex.test(officeStartTime) || !timeRegex.test(officeEndTime)) {
            console.error("Invalid office time format in admin settings. Expected format: HH:MM AM/PM");
            return {
                success: false,
                error: "Invalid office time format in admin settings"
            };
        }

        const allowedBreakHours = 1; // Default to 1 hour break

        // Calculate office working hours
        const officeWorkingHours = calculateWorkedHours(officeStartTime, officeEndTime);

        // Calculate detailed time metrics
        const timeMetrics = calculateDetailedTimeMetrics({
            punchInTime: startTime,
            punchOutTime: endTime,
            officeStartTime,
            officeEndTime,
            breakStartTime,
            breakEndTime,
            allowedBreakHours
        });


        // Calculate per hour salary
        const attendanceDate = new Date(date);
        const monthDays = new Date(attendanceDate.getFullYear(), attendanceDate.getMonth() + 1, 0).getDate();
        const ctcAmount = salaryDetails.ctcAmount;
        const perDaySalary = ctcAmount / monthDays;
        const perHourSalary = perDaySalary / officeWorkingHours;
        // Determine if overall there's a fine or overtime
        const totalFineHours = (timeMetrics.LateCommingTime + timeMetrics.EarlyOutOffice + timeMetrics.excessBreakHours) / 60;

        const totalOvertimeHours = (timeMetrics.EarlyCommingTime + timeMetrics.LateOutOffice) / 60;

        // Calculate specific fine/overtime amounts
        const lateEntryAmount = (timeMetrics.LateCommingTime / 60) * perHourSalary;
        const earlyOutAmount = (timeMetrics.EarlyOutOffice / 60) * perHourSalary;
        const excessBreakAmount = (timeMetrics.excessBreakHours / 60) * perHourSalary;
        const earlyEntryAmount = (timeMetrics.EarlyCommingTime / 60) * perHourSalary;
        const lateOutAmount = (timeMetrics.LateOutOffice / 60) * perHourSalary;

        // Calculate total fine and overtime amounts
        const totalFineAmount = lateEntryAmount + earlyOutAmount + excessBreakAmount;
        const totalOvertimeAmount = earlyEntryAmount + lateOutAmount;


        // Determine whether to apply fine or overtime
        // We apply fine if totalFineHours > totalOvertimeHours
        // Otherwise, we apply overtime
        const totalWorkedHours = calculateWorkedHours(officeStartTime, officeEndTime);
        if (timeMetrics.effectiveWorkHours < totalWorkedHours) {
            // FINE CASE: Apply fine and remove any existing overtime

            // Remove existing overtime entry if any
            const findOvertime = await prisma.overtime.findFirst({
                where: { staffId: staffId, date: date }
            });

            if (findOvertime) {
                await prisma.overtime.delete({
                    where: { id: findOvertime.id }
                });
            }

            // Check if fine entry already exists
            let existingFine = await prisma.fine.findFirst({
                where: { staffId: staffId, date: date }
            });

            // Fine data to update or create
            const fineData = {
                lateEntryFineHoursTime: timeMetrics.LateCommingTime > 0 ? formatHoursToTime(timeMetrics.LateCommingTime / 60) : null,
                lateEntryAmount: parseFloat(lateEntryAmount.toFixed(2)),
                excessBreakFineHoursTime: timeMetrics.excessBreakHours > 0 ? formatHoursToTime(timeMetrics.excessBreakHours / 60) : null,
                excessBreakAmount: parseFloat(excessBreakAmount.toFixed(2)),
                earlyOutFineHoursTime: timeMetrics.EarlyOutOffice > 0 ? formatHoursToTime(timeMetrics.EarlyOutOffice / 60) : null,
                earlyOutAmount: parseFloat(earlyOutAmount.toFixed(2)),
                totalAmount: parseFloat(totalFineAmount.toFixed(2)),
                date: date,
                totalOvertimeHours: formatHoursToTime(totalFineHours)
            };

            if (existingFine) {
                // Update fine entry
                await prisma.fine.update({
                    where: { id: existingFine.id },
                    data: fineData
                });
            } else {
                // Create fine entry
                await prisma.fine.create({
                    data: {
                        ...fineData,
                        staff: {
                            connect: {
                                id: staffId
                            }
                        },
                        AttendanceStaff: {
                            connect: {
                                id: attendanceId
                            }
                        },
                        SalaryDetail: {
                            connect: {
                                id: salaryDetails.id
                            }
                        },
                        adminId: adminId
                    }
                });
            }

            return {
                success: true,
                result: "fine",
                timeMetrics,
                fineDetails: {
                    lateEntryHours: timeMetrics.lateEntryHours,
                    lateEntryAmount: parseFloat(lateEntryAmount.toFixed(2)),
                    excessBreakHours: timeMetrics.excessBreakHours,
                    excessBreakAmount: parseFloat(excessBreakAmount.toFixed(2)),
                    earlyOutHours: timeMetrics.earlyOutHours,
                    earlyOutAmount: parseFloat(earlyOutAmount.toFixed(2)),
                    totalFineHours,
                    totalFineAmount: parseFloat(totalFineAmount.toFixed(2))
                }
            };
        } else if (timeMetrics.effectiveWorkHours > totalWorkedHours) {
            // OVERTIME CASE: Apply overtime and remove any existing fine

            // Remove existing fine entry if any
            const findFine = await prisma.fine.findFirst({
                where: { staffId: staffId, date: date }
            });

            if (findFine) {
                await prisma.fine.delete({
                    where: { id: findFine.id }
                });
            }

            // Check if overtime entry already exists
            let existingOvertime = await prisma.overtime.findFirst({
                where: { staffId: staffId, date: date }
            });

            // Overtime data to update or create
            const overtimeData = {
                earlyCommingEntryHoursTime: timeMetrics.EarlyCommingTime > 0 ? formatHoursToTime(timeMetrics.EarlyCommingTime / 60) : null,
                earlyEntryAmount: parseFloat(earlyEntryAmount.toFixed(2)),
                lateOutOvertimeHoursTime: timeMetrics.LateOutOffice > 0 ? formatHoursToTime(timeMetrics.LateOutOffice / 60) : null,
                lateOutAmount: parseFloat(lateOutAmount.toFixed(2)),
                totalAmount: parseFloat(totalOvertimeAmount.toFixed(2)),
                date: date
            };

            if (existingOvertime) {
                // Update overtime entry
                await prisma.overtime.update({
                    where: { id: existingOvertime.id },
                    data: overtimeData
                });
            } else {
                // Create overtime entry
                await prisma.overtime.create({
                    data: {
                        ...overtimeData,
                        staff: {
                            connect: {
                                id: staffId
                            }
                        },
                        AttendanceStaff: {
                            connect: {
                                id: attendanceId
                            }
                        },
                        SalaryDetail: {
                            connect: {
                                id: salaryDetails.id
                            }
                        },
                        adminId: adminId
                    }
                });
            }

            return {
                success: true,
                result: "overtime",
                timeMetrics,
                overtimeDetails: {
                    earlyArrivalHours: timeMetrics.earlyArrivalHours,
                    earlyEntryAmount: parseFloat(earlyEntryAmount.toFixed(2)),
                    lateDepartureHours: timeMetrics.lateDepartureHours,
                    lateOutAmount: parseFloat(lateOutAmount.toFixed(2)),
                    totalOvertimeHours,
                    totalOvertimeAmount: parseFloat(totalOvertimeAmount.toFixed(2))
                }
            };
        } else {
            // NO PENALTY OR OVERTIME CASE: Remove any existing entries

            // Clean up any existing fine or overtime entries
            const findFine = await prisma.fine.findFirst({
                where: { staffId: staffId, date: date }
            });

            if (findFine) {
                await prisma.fine.delete({
                    where: { id: findFine.id }
                });
            }

            const findOvertime = await prisma.overtime.findFirst({
                where: { staffId: staffId, date: date }
            });

            if (findOvertime) {
                await prisma.overtime.delete({
                    where: { id: findOvertime.id }
                });
            }

            return {
                success: true,
                result: "exact",
                timeMetrics,
                effectiveWorkHours: timeMetrics.effectiveWorkHours
            };
        }
    } catch (error) {
        console.error("Error calculating overtime and fine:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

const punchInStaff = async (req, res, next) => {
    try {
        const isStaff = await checkAdmin(req.userId, "STAFF");

        if (isStaff.error) {
            return res.status(403).json({ message: "You are not staff" });
        }

        const { date, punchInMethod, location, startTime, shift } = req.body;

        const punchInPhoto = req.file.path ? req.file.path : null;
        const findAttendance = await prisma.attendanceStaff.findFirst({
            where: {
                staffId: isStaff.user.StaffDetails.id,
                date: date
            }
        })

        let attendance;
        if (findAttendance) {
            attendance = await prisma.attendanceStaff.update({
                where: {
                    id: findAttendance.id
                },
                data: {
                    shift: shift,
                    startTime: startTime,
                    date: date,
                    status: "PRESENT",
                    punchInMethod: punchInMethod,
                    punchInLocation: location,
                    punchInPhoto: punchInPhoto,
                }
            });
        }

        else {
            attendance = await prisma.attendanceStaff.create({
                data: {
                    shift: shift,
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
        }

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

        const punchOutPhoto = req?.file?.path ? req?.file?.path : null;
        const findAttendance = await prisma.attendanceStaff.findFirst({
            where: {
                staffId: isStaff.user.StaffDetails.id,
                date: date
            }
        })


        if (!findAttendance) {
            return res.status(400).json({ message: "Staff has not punch in first. " });
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

        await calculateOvertimeAndFine(isStaff.user.StaffDetails.id, findAttendance.id, findAttendance.startTime, endTime, date, req.adminId);

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
                overTime: true,
                attendanceBreakRecord: true,
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
        const { startBreakLocation, attendanceId, startBreakTime, startBreakDate } = req.body;


        const currentDate = new Date().toISOString().split("T")[0] + "T00:00:00.000Z";

        if (new Date(startBreakDate).toISOString() !== currentDate) {
            return res.status(400).json({ message: "startBreakDate must be current date" });
        }


        if (!attendanceId) {
            return res.status(400).json({ message: "Attendance ID is required" });
        }

        const startBreakPhoto = req?.file?.path ? req?.file?.path : null;


        const findAttendance = await prisma.attendanceStaff.findUnique({
            where: {
                id: attendanceId
            }
        })

        if (!findAttendance) {
            return res.status(400).json({ message: "Staff has not punch in first" });
        }

        if (findAttendance.date !== startBreakDate) {
            return res.status(400).json({ message: "Staff current date attendance record not found" });
        }

        if (findAttendance.endTime !== null) {
            return res.status(400).json({ message: "Staff has already punch out" });
        }
        const findAttendanceRecord = await prisma.attendanceBreakRecord.findFirst({
            where: {
                attendanceId: attendanceId,
                startBreakDate: startBreakDate
            }
        })

        if (findAttendanceRecord) {
            return res.status(400).json({ message: "Break already started" });
        }


        const attendance = await prisma.attendanceBreakRecord.create({
            data: {
                startBreakLocation,
                startBreakTime,
                startBreakDate,
                startBreakPhoto,
                staffDetails: {
                    connect: { id: isStaff.user.StaffDetails.id }
                },
                attendanceStaff: {
                    connect: { id: findAttendance.id }
                },
                adminId: req.adminId,

            },
            select: {
                id: true,
                startBreakPhoto: true,
                startBreakLocation: true,
                startBreakTime: true,
                startBreakDate: true,
            }
        });
        res.status(200).json({ message: "Staff start break successfully", data: attendance });
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

        if (!attendanceId) {
            return res.status(400).json({ message: "Attendance ID is required" });
        }

        const endBreakPhoto = req?.file?.path ? req?.file?.path : null;
        console.log(endBreakPhoto);
        const findAttendance = await prisma.attendanceStaff.findUnique({
            where: {
                id: attendanceId
            }
        })

        if (!findAttendance) {
            return res.status(400).json({ message: "Staff has not punch in first" });
        }

        if (findAttendance.date !== endBreakDate) {
            return res.status(400).json({ message: "Staff current date attendance record not found" });
        }

        console.log(findAttendance);
        if (findAttendance.endTime !== null) {
            return res.status(400).json({ message: "Staff has already punch out" });
        }

        const findBreakRecord = await prisma.attendanceBreakRecord.findFirst({
            where: {
                attendanceId: findAttendance.id,
                startBreakDate: endBreakDate,
            }
        })

        if (!findBreakRecord) {
            return res.status(400).json({ message: "Staff has not start break first" });
        }

        if (findBreakRecord.endBreakTime !== null) {
            return res.status(400).json({ message: "Staff has already end break" });
        }

        const attendance = await prisma.attendanceBreakRecord.update({
            where: {
                id: findBreakRecord.id
            },
            data: {
                endBreakLocation,
                attendanceId,
                endBreakTime,
                endBreakDate,
                endBreakPhoto,
            },
            select: {
                id: true,
                endBreakTime: true,
                endBreakDate: true,
                endBreakLocation: true,
                endBreakPhoto: true,
            }
        });
        res.status(200).json({ message: "Staff end break successfully", data: attendance });
    }
    catch (err) {
        next(err);
    }
}

export { punchInStaff, punchOutStaff, getPunchRecords, startBreak, endBreak }; 
