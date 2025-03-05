import prisma from "../prisma/prisma.js";

const checkAdmin = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { adminDetails: true }
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (user.role !== 'ADMIN') {
        throw new Error("Access denied. User is not an admin.");
    }

    return user; // Return the user with adminDetails if needed
};

export default checkAdmin;