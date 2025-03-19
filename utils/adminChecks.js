import prisma from "../prisma/prisma.js";

const checkAdmin = async (userId, role = "ADMIN") => {

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                adminDetails: role === "ADMIN",
                StaffDetails: role === "STAFF",
            }
        });

        if (!user) {
            return { error: true, message: "User not found" };
        }

        if (user.role !== role) {
            return { error: true, message: `Access denied. User is not a ${role}` };
        }

        return { error: false, user };
    } catch (error) {
        return { error: true, message: error.message };
    }
};

export default checkAdmin;