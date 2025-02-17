import { PrismaClient } from "@prisma/client";
// Declare a singleton Prisma Client
let prisma;

if (process.env.NODE_ENV === "production") {
    // In production, we use a single Prisma client instance
    prisma = new PrismaClient();
} else {
    // In development, we use global for hot reloading
    if (!global.prisma) {
        global.prisma = new PrismaClient();
    }
    prisma = global.prisma;
}

// Handle graceful disconnection on app exit
process.on("beforeExit", async () => {
    console.log("Disconnecting Prisma...");
    await prisma.$disconnect();
});

export default prisma;