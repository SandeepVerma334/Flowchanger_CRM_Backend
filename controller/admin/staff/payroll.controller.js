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


const getSpecificStaffPayroll = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }
        const totalWorkingHours = Number(admin.user.adminDetails.officeWorkinghours || "8");
        console.log(totalWorkingHours);

        const { staffId, month, year } = req.params;

        if (!staffId) {
            return res.status(400).json({ message: "Staff ID is required" });
        }
        if (!month || !year) {
            return res.status(400).json({ message: "Month and year are required" });
        }

        const formattedMonth = month.toString().padStart(2, '0');
        const startDate = `${year}-${formattedMonth}-01`;
        const endTime = new Date(year, month, 0, 23, 59, 59);
        const formattedDay = endTime.getDate().toString().padStart(2, '0');
        const endDate = `${year}-${formattedMonth}-${formattedDay}`;
        const totalDays = parseInt(formattedDay); // Total days in the selected month

        let attendance = await prisma.attendanceStaff.findMany({
            where: {
                staffId: staffId,
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
            where: { staffId },
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
        let totalBreakTime = 0;
        let totalBreakAmount = 0;

        attendance = attendance.map(record => {

            const startTime = new Date(`${record.date} ${record.startTime}`);
            const endTime = new Date(`${record.date} ${record.endTime}`);
            let breakDuration = 0;
            const dailyTotalHours = (endTime - startTime) / (1000 * 60 * 60);
            totalHoursWorked += dailyTotalHours; // Convert milliseconds to hours



            if (record.status === "WEEK_OFF") totalWeekOff += 1;
            if (record.status === "PERSENT") totalPresent += 1;
            if (record.status === "HALF_DAY") totalHalfDay += 1;
            if (record.status === "PAIDLEAVE") totalPaidLeave += 1;

            if (record.attendanceBreakRecord.length > 0) {
                breakDuration = calculateBreakDuration(record.attendanceBreakRecord);
                totalBreakTime += breakDuration;
                totalBreakAmount += breakDuration * (dailySalary / totalWorkingHours);
            }


            if (record.fine.length > 0) {
                totalFine += record.fine.reduce((acc, fine) => acc + fine.totalAmount, 0);
            }
            if (record.overTime.length > 0) {
                totalOverTime += record.overTime.reduce((acc, overTime) => acc + overTime.totalAmount, 0);
            }


            return {
                ...record,
                totalHours: dailyTotalHours,
                breakDuration,
                breakAmount: breakDuration * (dailySalary / totalWorkingHours),
                dailySalary: record.status === "WEEK_OFF" ? dailySalary : dailyTotalHours * (dailySalary / totalWorkingHours),
            }
        });

        totalHoursWorked -= totalBreakTime;
        const absent = totalDays - totalPresent - totalHalfDay - totalPaidLeave - totalWeekOff;
        const payableSalary = totalSalary * (totalHoursWorked / (totalDays * totalWorkingHours));


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
                data: { amount: parseFloat(payableSalary.toFixed(2)) }
            });
        } else {
            await prisma.paymentHistory.create({
                data: {
                    date: new Date(`${year}-${formattedMonth}-${totalDays}`),
                    SalaryDetails: { connect: { id: salary.id } },
                    staff: { connect: { id: staffId } },
                    admin: { connect: { id: req.userId } },
                    amount: parseFloat(payableSalary.toFixed(2))
                }
            });
        }


        res.status(200).json({
            message: "Payrolls fetched successfully",
            attendance,
            totalHoursWorked,
            totalPresent,
            totalHalfDay,
            totalPaidLeave,
            absent,
            totalWeekOff,
            totalSalary,
            totalBreakTime,
            totalBreakAmount: parseFloat(totalBreakAmount.toFixed(2)),
            totalFine: parseFloat(totalFine.toFixed(2)),
            totalOverTime: parseFloat(totalOverTime.toFixed(2)),
            perHourSalary: parseFloat((dailySalary / totalWorkingHours).toFixed(2)),
            dailySalary: parseFloat(dailySalary.toFixed(2)),
            payableSalary: parseFloat((payableSalary - totalBreakAmount).toFixed(2)),
        });
    } catch (error) {
        next(error);
    }
};

const getMultipleStaffPayroll = async (req, res, next) => {
    try {

        const admin = await checkAdmin(req.userId);
        const totalWorkingHours = Number(admin.user.adminDetails.officeWorkinghours || "8");

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
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
            return res.status(400).json({ message: "No staff found" });
        }

        const formattedMonth = month.toString().padStart(2, '0');
        const startDate = `${year}-${formattedMonth}-01`;
        const endTime = new Date(year, month, 0, 23, 59, 59);
        const formattedDay = endTime.getDate().toString().padStart(2, '0');
        const endDate = `${year}-${formattedMonth}-${formattedDay}`;
        const totalDays = parseInt(formattedDay);

        const payrollData = await Promise.all(staffIds.map(async ({ id: staffId, User, employeeId, BankDetails }) => {
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

            const salary = await prisma.salaryDetail.findFirst({ where: { staffId } });
            if (!salary) {
                return { staffId, message: "Salary details not found" };
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
            let totalBreakTime = 0;
            let totalBreakAmount = 0;

            attendance = attendance.map(record => {
                const startTime = new Date(`${record.date} ${record.startTime}`);
                const endTime = new Date(`${record.date} ${record.endTime}`);
                let breakDuration = 0;
                const dailyTotalHours = (endTime - startTime) / (1000 * 60 * 60);
                totalHoursWorked += dailyTotalHours;

                if (record.status === "WEEK_OFF") totalWeekOff += 1;
                if (record.status === "PERSENT") totalPresent += 1;
                if (record.status === "HALF_DAY") totalHalfDay += 1;
                if (record.status === "PAIDLEAVE") totalPaidLeave += 1;

                if (record.attendanceBreakRecord.length > 0) {
                    breakDuration = calculateBreakDuration(record.attendanceBreakRecord);
                    totalBreakTime += breakDuration;
                    totalBreakAmount += breakDuration * (dailySalary / totalWorkingHours);
                }

                if (record.fine.length > 0) {
                    totalFine += record.fine.reduce((acc, fine) => acc + fine.totalAmount, 0);
                }
                if (record.overTime.length > 0) {
                    totalOverTime += record.overTime.reduce((acc, overTime) => acc + overTime.totalAmount, 0);
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
            const absent = totalDays - totalPresent - totalHalfDay - totalPaidLeave - totalWeekOff;
            const payableSalary = totalSalary * (totalHoursWorked / (totalDays * totalWorkingHours));

            const existingPayment = await prisma.paymentHistory.findFirst({
                where: {
                    staffId,
                    adminId: req.userId,
                    createdAt: {
                        gte: new Date(startDate), // After or equal to the start of the month
                        lte: new Date(endDate),   // Before or equal to the end of the month
                    }
                }
            });

            console.log(existingPayment);
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
            return {
                name: User?.firstName + " " + User?.lastName || "N/A",
                bankName: BankDetails[0]?.bankName || "N/A",
                employeeId,
                staffId,
                totalHoursWorked,
                totalPresent,
                totalHalfDay,
                totalPaidLeave,
                absent,
                totalWeekOff,
                totalSalary,
                totalBreakTime,
                totalBreakAmount: parseFloat(totalBreakAmount.toFixed(2)),
                totalFine: parseFloat(totalFine.toFixed(2)),
                totalOverTime: parseFloat(totalOverTime.toFixed(2)),
                perHourSalary: parseFloat((dailySalary / totalWorkingHours).toFixed(2)),
                dailySalary: parseFloat(dailySalary.toFixed(2)),
                payableSalary: parseFloat((payableSalary  - totalBreakAmount).toFixed(2)),
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
