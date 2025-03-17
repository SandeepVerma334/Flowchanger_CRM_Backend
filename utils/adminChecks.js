import prisma from "../prisma/prisma.js";

const checkAdmin = async (userId, role = "ADMIN") => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                adminDetails: role === "ADMIN" ? true : false,
                staffDetails: role === "STAFF" ? true : false
            }
        });

        if (!user) {
            return { error: true, status: 404, message: "User not found" };
        }

        if (user.role !== role) {
            return { error: true, status: 403, message: `Access denied. User is not a ${role}` };
        }

        return { error: false, status: 200, user };
    } catch (error) {
        return { error: true, status: 500, message: error.message || "Internal Server Error" };
    }
};

export default checkAdmin;
