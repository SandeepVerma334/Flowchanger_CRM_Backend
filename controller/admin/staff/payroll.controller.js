import prisma from "../../../prisma/prisma.js";
import checkAdmin from "../../../utils/adminChecks.js";
import { pagination } from "../../../utils/pagination.js";

function calculateBreakDuration(attendanceBreakRecord) {
    return attendanceBreakRecord.reduce((acc, record) => {
        const startBreak = new Date(record.startBreak);
        const endBreak = new Date(record.endBreak);
        const breakDurationHours = (endBreak - startBreak) / (1000 * 60 * 60); // Convert milliseconds to hours
        acc += Number(breakDurationHours);
        return acc;
    }, 0);
}

function isLastDayOfMonth(date = new Date()) {
    let tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    return tomorrow.getDate() === 1;
}

function calculateWorkedHours(startTime, endTime) {
    function parseTimeToMinutes(time) {
        let [hour, minute, period] = time.match(/(\d+):(\d+) (AM|PM)/).slice(1);
        hour = parseInt(hour, 10);
        minute = parseInt(minute, 10);

        // Convert to 24-hour format
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

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

const getSpecificStaffPayroll = async (req, res, next) => {
    try {
        const isStaff = await checkAdmin(req.userId, "STAFF");

        if (isStaff.error) {
            return res.status(403).json({ message: "You are not staff" });
        }

        const admin = await prisma.adminDetails.findFirst({
            where: {
                id: req.adminId,
            },
        });



        let totalWorkingHours = Number(admin.officeWorkinghours || 8);
        const officeStartTime = admin.officeStartTime;
        const officeEndtime = admin.officeEndtime;

        if (officeStartTime && officeEndtime) {
            totalWorkingHours = calculateWorkedHours(officeStartTime, officeEndtime);
        }

        const { month, year } = req.params;

        
        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const formattedMonth = month.toString().padStart(2, '0');
        const startDate = `${year}-${formattedMonth}-01`;
        const endTime = new Date(year, month, 0, 23, 59, 59);
        const formattedDay = endTime.getDate().toString().padStart(2, '0');
        const endDate = `${year}-${formattedMonth}-${formattedDay}`;
        const totalDays = parseInt(formattedDay); // Total days in the selected month

        const staff = await prisma.staffDetails.findFirst({
            where: {
                id: isStaff.user.StaffDetails.id,
                adminId: req.adminId,
            },
        });


        if (!staff) {
            return res.status(404).json({ message: "Staff not found" });
        }

        const staffJoiningDate = new Date(staff.dateOfJoining);


        const staffJoiningMonth = staffJoiningDate.getMonth() + 1;
        const staffJoiningYear = staffJoiningDate.getFullYear();


        if (staffJoiningYear > year || (staffJoiningYear == year && staffJoiningMonth > month)) {
            return res.status(400).json({ message: "Staff joined after the selected month" });
        }

        let attendance = await prisma.attendanceStaff.findMany({
            where: {
                staffId: isStaff.user.StaffDetails.id,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            orderBy: {
                date: 'asc',
            },
            include: {
                attendanceBreakRecord: true,
                fine: true,
                overTime: true
            }
        });

        const salary = await prisma.salaryDetail.findFirst({
            where: { staffId: isStaff.user.StaffDetails.id },
            orderBy: {
                createdAt: "desc"  // Ordering by newest first
            }

        });

        if (!salary) {
            return res.status(404).json({ message: "Salary details not found for this staff member" });
        }

        const totalSalary = salary.ctcAmount; // Monthly salary
        const dailySalary = totalSalary / totalDays;

        let totalHoursWorked = 0;
        let totalHalfDay = 0;
        let totalPresent = 0;
        let totalPaidLeave = 0;
        let totalWeekOff = 0;
        let totalFine = 0;
        let totalOverTime = 0;
        let totalApplyFine = 0;
        let totalApplyOverTime = 0;
        let totalBreakTime = 0;
        let totalBreakAmount = 0;
        let totalApplyBreakAmount = 0;
        let totalAbsent = 0;

        attendance = attendance.map(record => {
            const startTime = new Date(`${record.date} ${record.startTime}`);
            const endTime = new Date(`${record.date} ${record.endTime}`);
            let breakDuration = 0;
            const dailyTotalHours = (endTime - startTime) / (1000 * 60 * 60);
            if (record.status !== "HALF_DAY" && record.status !== "ABSENT" && record.status !== "PAIDLEAVE" && record.status !== "WEEK_OFF") {
                totalHoursWorked += dailyTotalHours; // Convert milliseconds to hours
            }

            if (record.status === "WEEK_OFF") totalWeekOff += 1;
            if (record.status === "PRESENT") totalPresent += 1;
            if (record.status === "HALF_DAY") totalHalfDay += 1;
            if (record.status === "PAID_LEAVE") totalPaidLeave += 1;
            if (record.status === "ABSENT") totalAbsent += 1;

            if (record.attendanceBreakRecord.length > 0) {
                breakDuration = calculateBreakDuration(record.attendanceBreakRecord);
                totalBreakTime += breakDuration;
                totalBreakAmount += breakDuration * (dailySalary / totalWorkingHours);
                totalApplyBreakAmount += calculateBreakDuration(record.attendanceBreakRecord.filter((breakRecord) => breakRecord.applyBreak === true)) * (dailySalary / totalWorkingHours);
            }


            if (record.fine.length > 0) {
                totalFine += record.fine.reduce((acc, fine) => acc + fine.totalAmount, 0);
                totalApplyFine += record.fine.filter((overtime) => overtime.applyFine === true).reduce((acc, fine) => acc + fine.totalAmount, 0);
            }
            if (record.overTime.length > 0) {
                totalOverTime += record.overTime.reduce((acc, overTime) => acc + overTime.totalAmount, 0);
                totalApplyOverTime += record.overTime.filter((overtime) => overtime.applyOvertime === true).reduce((acc, overTime) => acc + overTime.totalAmount, 0);
            }

            return {
                ...record,
                totalHours: dailyTotalHours,
                breakDuration,
                breakAmount: breakDuration * (dailySalary / totalWorkingHours),
                dailySalary: record.status === "WEEK_OFF" ? dailySalary : record.status === "HALF_DAY" ? dailySalary / 2 : dailyTotalHours * (dailySalary / totalWorkingHours),
            }
        });

        totalHoursWorked -= totalBreakTime;

        const totalPaidLeaveAmount = totalPaidLeave * dailySalary;
        const totalHalfDayAmount = totalHalfDay * dailySalary / 2;
        const totalAbsentAmount = totalAbsent * dailySalary;
        const payableSalary = dailySalary * (totalPresent + totalPaidLeave + totalWeekOff);

        const existingPayment = await prisma.paymentHistory.findFirst({
            where: {
                staffId: isStaff.user.StaffDetails.id,
                adminId: req.userId,
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                }
            }
        });

        if (existingPayment) {
            await prisma.paymentHistory.update({
                where: { id: existingPayment.id },
                data: { amount: parseFloat(payableSalary.toFixed(2)) }
            });
        } else {
            await prisma.paymentHistory.create({
                data: {
                    date: new Date(`${year}-${formattedMonth}-${totalDays}`),
                    SalaryDetails: { connect: { id: salary.id } },
                    staff: { connect: { id: isStaff.user.StaffDetails.id } },
                    admin: { connect: { id: req.userId } },
                    amount: parseFloat(payableSalary.toFixed(2))
                }
            });
        }


        if (isLastDayOfMonth()) {
            await prisma.salaryDetail.update({
                where: { id: salary.id },
                data: {
                    payrollFinalized: true,
                    finalizedDate: new Date(),
                    finalSalary: parseFloat((payableSalary - totalBreakAmount).toFixed(2)),
                }
            })
        }

        res.status(200).json({
            message: "Payrolls fetched successfully",
            totalHoursWorked,
            totalPresent,
            totalHalfDay,
            totalPaidLeave,
            totalAbsent,
            totalWeekOff,
            totalSalary,
            totalBreakTime,
            totalAbsentAmount: parseFloat(totalAbsentAmount.toFixed(2)),
            totalPaidLeaveAmount: parseFloat(totalPaidLeaveAmount.toFixed(2)),
            totalHalfDayAmount: parseFloat(totalHalfDayAmount.toFixed(2)),
            totalBreakAmount: parseFloat(totalBreakAmount.toFixed(2)),
            totalApplyBreakAmount: parseFloat(totalApplyBreakAmount.toFixed(2)),
            totalFine: parseFloat(totalFine.toFixed(2)),
            totalApplyFine: parseFloat(totalApplyFine.toFixed(2)),
            totalOverTime: parseFloat(totalOverTime.toFixed(2)),
            totalApplyOverTime: parseFloat(totalApplyOverTime.toFixed(2)),
            perHourSalary: parseFloat((dailySalary / totalWorkingHours).toFixed(2)),
            dailySalary: parseFloat(dailySalary.toFixed(2)),
            payableSalary: parseFloat((payableSalary - totalApplyFine + totalHalfDayAmount + totalApplyOverTime - totalApplyBreakAmount).toFixed(2)),
        });
    } catch (error) {
        next(error);
    }
};

const getMultipleStaffPayroll = async (req, res, next) => {
    try {

        const admin = await checkAdmin(req.userId);



        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        let totalWorkingHours = Number(admin.user.adminDetails.officeWorkinghours || 8);
        const officeStartTime = admin.user.adminDetails.officeStartTime;
        const officeEndtime = admin.user.adminDetails.officeEndtime;
        if (officeStartTime && officeEndtime) {
            totalWorkingHours = calculateWorkedHours(officeStartTime, officeEndtime);
        }

        const staffIds = await prisma.staffDetails.findMany({
            where: {
                User: {
                    adminId: req.userId
                }
            },
            select: {
                id: true,
                employeeId: true,
                dateOfJoining: true,
                User: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                },

                BankDetails: {
                    select: {
                        bankName: true,
                        accountNumber: true,
                    }
                }

            },
        });

        const { month, year } = req.params;

        if (!month) {
            return res.status(400).json({ message: "Month is required" });
        }

        if (!year) {
            return res.status(400).json({ message: "Year is required" });
        }

        if (!Array.isArray(staffIds) || staffIds.length === 0) {
            return res.status(404).json({ message: "No staff found" });
        }

        const formattedMonth = month.toString().padStart(2, '0');
        const startDate = `${year}-${formattedMonth}-01`;
        const endTime = new Date(year, month, 0, 23, 59, 59);
        const formattedDay = endTime.getDate().toString().padStart(2, '0');
        const endDate = `${year}-${formattedMonth}-${formattedDay}`;
        const totalDays = parseInt(formattedDay);

        const payrollData = await Promise.all(staffIds.map(async ({ id: staffId, User, employeeId, BankDetails, dateOfJoining }) => {

            const staff = await prisma.staffDetails.findFirst({
                where: {
                    id: staffId,
                },
                select: {
                    id: true,
                }
            });


            if (!staff) {
                return res.status(404).json({ message: "Staff not found" });
            }

            const staffJoiningDate = new Date(dateOfJoining);

            const staffJoiningMonth = staffJoiningDate.getMonth() + 1;
            const staffJoiningYear = staffJoiningDate.getFullYear();

            if (staffJoiningYear > year || (staffJoiningYear == year && staffJoiningMonth > month)) {
                return {
                    name: User?.firstName + " " + User?.lastName || "N/A",
                    staffId,
                    bankName: BankDetails[0]?.bankName || "N/A",
                    employeeId,
                    message: "Staff joined after the selected month"
                };
            }

            let attendance = await prisma.attendanceStaff.findMany({
                where: {
                    staffId,
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                orderBy: {
                    date: 'asc',
                },
                include: {
                    attendanceBreakRecord: true,
                    fine: true,
                    overTime: true
                }
            });

            const salary = await prisma.salaryDetail.findFirst({
                where:
                    { staffId },
                orderBy: {
                    createdAt: "desc"  // Ordering by newest first
                }
            });
            if (!salary) {
                return {
                    name: User?.firstName + " " + User?.lastName || "N/A",
                    bankName: BankDetails[0]?.bankName || "N/A",
                    employeeId,
                    staffId,
                    message: "Salary details not found"
                };
            }

            const totalSalary = salary.ctcAmount;
            const dailySalary = totalSalary / totalDays;
            let totalHoursWorked = 0;
            let totalHalfDay = 0;
            let totalPresent = 0;
            let totalPaidLeave = 0;
            let totalWeekOff = 0;
            let totalFine = 0;
            let totalOverTime = 0;
            let totalApplyFine = 0;
            let totalApplyOverTime = 0;
            let totalBreakTime = 0;
            let totalBreakAmount = 0;
            let totalApplyBreakAmount = 0;
            let totalAbsent = 0;

            attendance = attendance.map(record => {
                const startTime = new Date(`${record.date} ${record.startTime}`);
                const endTime = new Date(`${record.date} ${record.endTime}`);
                let breakDuration = 0;
                const dailyTotalHours = (endTime - startTime) / (1000 * 60 * 60);
                if (record.status !== "HALF_DAY" && record.status !== "ABSENT" && record.status !== "PAIDLEAVE" && record.status !== "WEEK_OFF") {
                    totalHoursWorked += dailyTotalHours; // Convert milliseconds to hours
                }

                if (record.status === "WEEK_OFF") totalWeekOff += 1;
                if (record.status === "PRESENT") totalPresent += 1;
                if (record.status === "HALF_DAY") totalHalfDay += 1;
                if (record.status === "PAID_LEAVE") totalPaidLeave += 1;
                if (record.status === "ABSENT") totalAbsent += 1;

                if (record.attendanceBreakRecord.length > 0) {
                    breakDuration = calculateBreakDuration(record.attendanceBreakRecord);
                    totalBreakTime += breakDuration;
                    totalBreakAmount += breakDuration * (dailySalary / totalWorkingHours);
                    totalApplyBreakAmount += calculateBreakDuration(record.attendanceBreakRecord.filter((breakRecord) => breakRecord.applyBreak === true)) * (dailySalary / totalWorkingHours);
                }



                if (record.fine.length > 0) {
                    totalFine += record.fine.reduce((acc, fine) => acc + fine.totalAmount, 0);
                    totalApplyFine += record.fine.filter((overtime) => overtime.applyFine === true).reduce((acc, fine) => acc + fine.totalAmount, 0);
                }
                if (record.overTime.length > 0) {
                    totalOverTime += record.overTime.reduce((acc, overTime) => acc + overTime.totalAmount, 0);
                    totalApplyOverTime += record.overTime.filter((overtime) => overtime.applyOvertime === true).reduce((acc, overTime) => acc + overTime.totalAmount, 0);
                }

                return {
                    ...record,
                    totalHours: dailyTotalHours,
                    breakDuration,
                    breakAmount: breakDuration * (dailySalary / totalWorkingHours),
                    dailySalary: record.status === "WEEK_OFF" ? dailySalary : dailyTotalHours * (dailySalary / totalWorkingHours),
                };
            });



            totalHoursWorked -= totalBreakTime;
            const payableSalary = (totalPresent + totalWeekOff + totalPaidLeave + totalHalfDay / 2) * dailySalary;
            const totalPaidLeaveAmount = dailySalary * totalPaidLeave
            const totalHalfDayAmount = dailySalary * totalHalfDay / 2
            const totalAbsentAmount = totalAbsent * dailySalary


            if (isLastDayOfMonth()) {
                await prisma.salaryDetail.update({
                    where: { id: salary.id },
                    data: {
                        payrollFinalized: true,
                        finalizedDate: new Date(),
                        finalSalary: parseFloat((payableSalary - totalBreakAmount).toFixed(2)),
                    }
                })
            }

            const existingPayment = await prisma.paymentHistory.findFirst({
                where: {
                    staffId,
                    adminId: req.userId,
                    date: {
                        gte: new Date(startDate), // After or equal to the start of the month
                        lte: new Date(endDate),   // Before or equal to the end of the month
                    }
                }
            });


            if (existingPayment) {
                await prisma.paymentHistory.update({
                    where: { id: existingPayment.id },
                    data: { amount: payableSalary }
                });
            } else {
                await prisma.paymentHistory.create({
                    data: {
                        SalaryDetails: { connect: { id: salary.id } },
                        staff: { connect: { id: staffId } },
                        admin: { connect: { id: req.userId } },
                        amount: payableSalary
                    }
                });
            }

            if (isLastDayOfMonth()) {
                await prisma.salaryDetail.update({
                    where: { id: salary.id },
                    data: {
                        payrollFinalized: true,
                        finalizedDate: new Date(),
                        finalSalary: parseFloat((payableSalary - totalBreakAmount).toFixed(2)),
                    }
                })
            }


            return {
                name: ((User?.firstName || "") + " " + (User?.lastName || "")) || "N/A",
                bankName: BankDetails[0]?.bankName || "N/A",
                employeeId,
                staffId,
                totalHoursWorked,
                totalPresent,
                totalHalfDay,
                totalPaidLeave,
                totalAbsent: totalAbsent,
                totalWeekOff,
                totalSalary,
                totalBreakTime,
                totalAbsentAmount: parseFloat(totalAbsentAmount.toFixed(2)),
                totalPaidLeaveAmount: parseFloat(totalPaidLeaveAmount.toFixed(2)),
                totalHalfDayAmount: parseFloat(totalHalfDayAmount.toFixed(2)),
                totalBreakAmount: parseFloat(totalBreakAmount.toFixed(2)),
                totalApplyBreakAmount: parseFloat(totalApplyBreakAmount.toFixed(2)),
                totalFine: parseFloat(totalFine.toFixed(2)),
                totalApplyFine: parseFloat(totalApplyFine.toFixed(2)),
                totalOverTime: parseFloat(totalOverTime.toFixed(2)),
                totalApplyOverTime: parseFloat(totalApplyOverTime.toFixed(2)),
                perHourSalary: parseFloat((dailySalary / totalWorkingHours).toFixed(2)),
                dailySalary: parseFloat(dailySalary.toFixed(2)),
                payableSalary: parseFloat((payableSalary - totalApplyFine + totalApplyOverTime - totalApplyBreakAmount).toFixed(2)),
            };
        }));


        res.status(200).json({ message: "Payrolls fetched successfully", data: payrollData });
    } catch (error) {
        next(error);
    }
};

const getPaymentHistory = async (req, res, next) => {
    try {
        const { staffId } = req.params;
        const { page, limit } = req.query;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }
        const paymentHistory = await pagination(prisma.paymentHistory, {
            page,
            limit,
            where: {
                staffId,
                adminId: req.userId,
            },
            select: {
                id: true,
                staff: {
                    select: {
                        employeeId: true,
                    }
                },
                amount: true,
                date: true,
                updatedAt: true,
                type: true,
                status: true
            }
        });
        res.status(200).json({ message: "Payment history fetched successfully", ...paymentHistory });
    } catch (error) {
        next(error);
    }
}

export { getSpecificStaffPayroll, getMultipleStaffPayroll, getPaymentHistory };