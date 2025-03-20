import prisma from "../../../prisma/prisma.js";
import checkAdmin from "../../../utils/adminChecks.js";
import { pagination } from "../../../utils/pagination.js";

const getSpecificStaffPayroll = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        const { staffId, month, year } = req.params;

        const formattedMonth = month.toString().padStart(2, '0');
        const startDate = `${year}-${formattedMonth}-01`;

        const endTime = new Date(year, month, 0, 23, 59, 59);
        const formattedDay = endTime.getDate().toString().padStart(2, '0');
        const endDate = `${year}-${formattedMonth}-${formattedDay}`;

        const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24) + 1; // Convert milliseconds to days

        console.log(totalDays);

        const attendance = await prisma.attendanceStaff.findMany({
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

        });

        const salary = await prisma.salaryDetail.findFirst({
            where: {
                staffId: staffId,
                effectiveDate: `${year}-${month < 10 ? "0" + month : month}-15T00:00:00.000Z`
            },
        });

        let totalHoursWorked = 0;
        let halfDay = 0;
        let present = 0;
        let paidLeave = 0;

        for (let i = 0; i < attendance.length; i++) {
            const attendanceRecord = attendance[i];
            const startTime = new Date(`${attendanceRecord.date} ${attendanceRecord.startTime}`);
            const endTime = new Date(`${attendanceRecord.date} ${attendanceRecord.endTime}`);

            const timeDifference = (endTime - startTime) / (1000 * 60 * 60); // Convert milliseconds to hours
            totalHoursWorked += timeDifference

            if (attendanceRecord.status === "PERSENT") {
                present += 1;
            }
            if (attendanceRecord.status === "HALF_DAY") {
                halfDay += 1;
            }
            if (attendanceRecord.status === "PAIDLEAVE") {
                paidLeave += 1;
            }
        }

        res.status(200).json({
            message: "Payrolls fetched successfully",
            attendance,
            totalHoursWorked,
            present,
            halfDay,
            paidLeave,
            absent: totalDays - present - halfDay - paidLeave,
        });
    } catch (error) {
        next(error);
    }
};


export { getSpecificStaffPayroll };