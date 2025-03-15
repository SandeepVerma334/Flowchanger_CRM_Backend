import prisma from "../prisma/prisma.js";

const checkAdmin = async (userId, role = "ADMIN") => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                adminDetails: role === "ADMIN",
                staffDetails: role === "STAFF"
            }
        });

        if (!user) {
            return { error: true, status: 404, message: "User not found" };
        }

        if (!(user.role === "ADMIN" || user.role === "STAFF")) {
            return { error: true, status: 403, message: `Access denied. User is not an ${role}` };
        }

        return { user }; // Return the user if they have the correct role
    } catch (error) {
        return { error: "Internal Server Error", status: 500 };
    }
};

export default checkAdmin;
