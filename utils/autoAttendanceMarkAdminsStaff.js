
import prisma from "../prisma/prisma.js";
import cron from "node-cron"; 

const convertTo24Hour = (time) => {
    const [hour, minute] = time.split(":");
    const period = minute.slice(-2); 
    let hour24 = parseInt(hour, 10);

    if (period === "PM" && hour24 !== 12) {
        hour24 += 12; 
    }
    if (period === "AM" && hour24 === 12) {
        hour24 = 0; 
    }

    const formattedHour = hour24.toString().padStart(2, "0"); //
    const formattedMinute = minute.slice(0, 2); 
    return `${formattedHour}:${formattedMinute}`; 
};

const autoCreateAttendance = async () => {
    try {
        const admins = await prisma.adminDetails.findMany();
        console.log("📌 Admins Data:", admins);

        // Iterate over each admin
        for (const admin of admins) {
            const staff = await prisma.user.findMany({
                where: { adminId: admin.userId, role: "STAFF" },
                include: { StaffDetails: true },
            });

            console.log("📌 Staff Data:", staff);

            // For each admin, schedule a cron job based on their officeStartTime and officeEndtime
            const { officeStartTime, officeEndtime } = admin;

            // If officeStartTime and officeEndtime are set, create cron jobs
            if (officeStartTime && officeEndtime) {
                const start24HourTime = convertTo24Hour(officeStartTime); 
                const end24HourTime = convertTo24Hour(officeEndtime); 

                const [startHour, startMinute] = start24HourTime.split(":");
                const [endHour, endMinute] = end24HourTime.split(":");

                // Create cron expressions based on 24-hour formatted times
                const startCron = `${startMinute} ${startHour} * * *`; // Every day at officeStartTime
                const endCron = `${endMinute} ${endHour} * * *`; // Every day at officeEndtime

                // Get today's date and check if it's Sunday
                const dateToday = new Date();
                const dayOfWeek = dateToday.getDay(); // 0 for Sunday, 1 for Monday, etc.
                const date = dateToday.toISOString().split("T")[0]; // Format date as 'YYYY-MM-DD'

                cron.schedule(startCron, () => {
                    console.log(`⏰ Checking attendance for Admin ${admin.companyName} at ${officeStartTime}`);                   
                });

                cron.schedule(endCron, async () => {
                    console.log(`⏰ Checking attendance for Admin ${admin.companyName} at ${officeEndtime}`);
                    let status = "ABSENT";                 
                    if (dayOfWeek === 0) {
                        status = "WEEK_OFF";
                    }

                    // Check if attendance already exists between officeStartTime and officeEndtime for the current day
                    const existingAttendance = await prisma.attendanceStaff.findFirst({
                        where: {
                            adminId: admin.id,
                            date: date,
                            // Ensure that startTime is between officeStartTime and officeEndtime
                            AND: [
                                {
                                    startTime: {
                                        gte: start24HourTime, // Greater than or equal to officeStartTime
                                    },
                                },
                                {
                                    endTime: {
                                        lte: end24HourTime, // Less than or equal to officeEndTime
                                    },
                                },
                            ],
                        },
                    });

                    // If no attendance exists for the current date and time range, create it
                    if (!existingAttendance) {
                        const attendanceEntry = await prisma.attendanceStaff.create({
                            data: {
                                adminId: admin.id,
                                staffId: staff[0].StaffDetails.id, // Use first staff (you may want to handle this for multiple staff)
                                date: date,
                                status: status,
                                // startTime: start24HourTime,
                                // endTime: end24HourTime,
                            },
                        });
                        console.log(`Attendance marked as ${status} for Staff ID ${staff[0].id} on ${date}`);
                        console.log("attendanceEntry", attendanceEntry);
                    } else {
                        console.log(`Attendance already exists for Staff ID ${staff[0].id} on ${date}`);
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error Fetching Data:", error);
    } finally {
        await prisma.$disconnect();
    }
};

export default autoCreateAttendance;
