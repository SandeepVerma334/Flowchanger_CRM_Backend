import prisma from "../prisma/prisma.js";

// Get current time in Indian Time (Asia/Kolkata)
function getIndiaTime(date) {
    const inputDate = date ? new Date(date) : new Date(); // Use provided date or current date
    return new Date(inputDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
};

export default getIndiaTime;