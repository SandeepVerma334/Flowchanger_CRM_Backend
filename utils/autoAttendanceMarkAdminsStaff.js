// import prisma from "../prisma/prisma.js";
// import cron from "node-cron";

// const convertTo24Hour = (time) => {
//     const [hour, minute] = time.split(":");
//     const period = minute.slice(-2);
//     let hour24 = parseInt(hour, 10);

//     if (period === "PM" && hour24 !== 12) {
//         hour24 += 12;
//     }
//     if (period === "AM" && hour24 === 12) {
//         hour24 = 0;
//     }

//     const formattedHour = hour24.toString().padStart(2, "0");
//     const formattedMinute = minute.slice(0, 2);
//     return `${formattedHour}:${formattedMinute}`;
// };

// const autoCreateAttendance = async () => {
//     try {
//         const admins = await prisma.adminDetails.findMany();
//         console.log("📌 Admins Data:", admins);

//         for (const admin of admins) {
//             const staff = await prisma.user.findMany({
//                 where: { adminId: admin.userId, role: "STAFF" },
//                 include: { StaffDetails: true },
//             });

//             console.log("📌 Staff Data:", staff);

//             const { officeStartTime, officeEndtime } = admin;

//             if (officeStartTime && officeEndtime) {
//                 const start24HourTime = convertTo24Hour(officeStartTime);
//                 const end24HourTime = convertTo24Hour(officeEndtime);

//                 const [endHour, endMinute] = end24HourTime.split(":");
//                 const endCron = `${parseInt(endMinute) + 1} ${endHour} * * *`; // 1 min after officeEndTime

//                 const dateToday = new Date();
//                 const dayOfWeek = dateToday.getDay();
//                 const date = dateToday.toISOString().split("T")[0];
//                 console.log("📌 Date:", date);
//                 cron.schedule(endCron, async () => {
//                     console.log(`⏰ Checking attendance for Admin ${admin.companyName} at ${officeEndtime}`);

//                     for (const staffMember of staff) {
//                         console.log("📌 Staff Member:", staffMember);
//                         console.log("dummy " , staffMember.adminId , "dummy 1 " , staffMember.StaffDetails.id)
//                         const existingAttendance = await prisma.attendanceStaff.findFirst({
//                             where: {
//                                 adminId: staffMember.StaffDetails.adminId,
//                                 staffId: staffMember.StaffDetails.id,

//                             },
//                             orderBy: {
//                                 createdAt: "desc",
//                             },
//                         });
//                         console.log("existingAttendance ", existingAttendance);
//                         if (!existingAttendance) {
//                             await prisma.attendanceStaff.create({
//                                 data: {
//                                     adminId: admin.id,
//                                     staffId: staffMember.id,
//                                     date: date,
//                                     status: "NOT_DEFINED",
//                                 },
//                             });
//                             console.log(`✅ Attendance created with status NOT_DEFINED for Staff ID ${staffMember.id}`);
//                         } else if (existingAttendance.status === "NOT_DEFINED") {

//                             const updatedStatus = dayOfWeek === 0 ? "WEEK_OFF" : "ABSENT";
//                             console.log(updatedStatus);
//                             await prisma.attendanceStaff.update({
//                                 where: { id: existingAttendance.id },
//                                 data: { status: updatedStatus },
//                             });

//                             console.log(`🚀 Status updated to ${updatedStatus} for Staff ID ${staffMember.id}`);
//                         } else {
//                             console.log(`⚠️ Staff ID ${staffMember.id} already has a status: ${existingAttendance.status}`);
//                         }
//                     }
//                 });
//             }
//         }
//     } catch (error) {
//         console.error("❌ Error Fetching Data:", error);
//     } finally {
//         await prisma.$disconnect();
//     }
// };

// export default autoCreateAttendance;
