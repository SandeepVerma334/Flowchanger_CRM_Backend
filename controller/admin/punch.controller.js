import { ZodError } from "zod";
import { prisma } from "../prismaClient.js"; // adjust import as needed
import { PunchInSchema, PunchOutSchema } from "../validationSchemas.js"; // adjust import as needed

// Helper: Convert minutes to HH:MM format
function convertMinutesToHHMM(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export async function createPunchIn(req, res) {
    try {
        const { punchInMethod, biometricData, qrCodeValue, location } = req.body;
        const validation = PunchInSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                status: false,
                message: validation.error.issues[0].message,
            });
        }
        const photoUrl = req.imageUrl ?? "null";

        // Get the staff user and include salary details if available
        const user = await prisma.user.findFirst({
            where: { id: req.userId, role: "STAFF" },
            include: { staffDetails: { include: { SalaryDetails: true } } },
        });
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Define today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tom = new Date(today);
        tom.setDate(today.getDate() + 1);

        // Ensure a punch-in has not already been recorded for today
        const existingPunchRecord = await prisma.punchRecords.findFirst({
            where: {
                staffId: user.staffDetails.id,
                punchDate: { gte: today, lt: tom },
            },
        });
        if (existingPunchRecord && existingPunchRecord.punchInId) {
            return res.status(400).send("Punch in already created");
        }

        // Create the punch-in record
        const punchIn = await prisma.punchIn.create({
            data: {
                punchInMethod,
                biometricData,
                qrCodeValue,
                photoUrl,
                location,
            },
        });

        // Upsert the punch record for today (using a composite key: staffId and punchDate)
        const punchRecord = await prisma.punchRecords.upsert({
            where: {
                staffId_punchDate: {
                    staffId: user.staffDetails.id,
                    punchDate: today,
                },
            },
            create: {
                punchIn: { connect: { id: punchIn.id } },
                staff: { connect: { id: user.staffDetails.id } },
                status: "PRESENT",
            },
            update: {
                punchIn: { connect: { id: punchIn.id } },
                status: "PRESENT",
            },
            include: { punchIn: true },
        });

        res.status(201).json({ punchIn, punchRecord });
    } catch (error) {
        console.error("Error in createPunchIn:", error);
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        return res.status(500).json({ error: "Failed to create punch-in" });
    }
}

export async function getAllPunchIn(req, res) {
    try {
        const punchRecords = await prisma.punchRecords.findMany({
            include: { punchIn: true },
        });
        res.status(200).json(punchRecords);
    } catch (error) {
        console.error("Error in getAllPunchIn:", error);    
        res.status(500).json({ error: "Failed to fetch punch-in records" });
    }
}

export async function createPunchOut(req, res) {
    try {
        const { punchOutMethod, biometricData, qrCodeValue, location } = req.body;
        const validation = PunchOutSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                status: false,
                message: validation.error.issues[0].message,
            });
        }
        const photoUrl = req.imageUrl ?? "null";

        // Get the staff user with salary details
        const user = await prisma.user.findFirst({
            where: { id: req.userId, role: "STAFF" },
            include: { staffDetails: { include: { SalaryDetails: true } } },
        });
        if (!user) {
            return res.status(404).send("User not found");
        }

        // Define today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tom = new Date(today);
        tom.setDate(today.getDate() + 1);

        // Retrieve today's punch record, ensuring a punch-in exists and no punch-out is recorded yet
        const existingPunchRecord = await prisma.punchRecords.findFirst({
            where: {
                staffId: user.staffDetails.id,
                punchDate: { gte: today, lt: tom },
            },
            include: { punchIn: true },
        });
        if (!existingPunchRecord || !existingPunchRecord.punchInId) {
            return res.status(400).send("No punch-in found for today");
        }
        if (existingPunchRecord.punchOutId) {
            return res.status(400).send("Punch-out already exists");
        }

        // Create the punch-out record
        const punchOut = await prisma.punchOut.create({
            data: {
                punchOutMethod,
                biometricData,
                qrCodeValue,
                photoUrl,
                location,
            },
        });

        // Update the punch record with the punch-out connection and retrieve the punch-in details
        const updatedPunchRecord = await prisma.punchRecords.update({
            where: { id: existingPunchRecord.id },
            data: {
                punchOut: { connect: { id: punchOut.id } },
                status: "PRESENT",
            },
            include: { punchIn: true },
        });

        // Compute the gap (in minutes) between punch-in and punch-out times
        const punchInTime = new Date(updatedPunchRecord.punchIn.punchInTime);
        const punchOutTime = new Date(punchOut.punchOutTime);
        const gapMinutes = Math.floor((punchOutTime - punchInTime) / (1000 * 60));
        const requiredMinutes = 510; // 8.5 hours in minutes

        // Retrieve the latest salary details; adjust field names as per your schema
        const salary =
            user.staffDetails.SalaryDetails &&
                user.staffDetails.SalaryDetails.length > 0
                ? user.staffDetails.SalaryDetails[
                    user.staffDetails.SalaryDetails.length - 1
                ].ctc_amount
                : null;
        if (!salary) {
            return res.status(404).send("No salary details found");
        }
        const dailySalary = salary / 30;
        const salaryPerMinute = dailySalary / requiredMinutes;

        // Apply fine if the gap is less than required; apply overtime if the gap exceeds required
        if (gapMinutes < requiredMinutes) {
            const missingMinutes = requiredMinutes - gapMinutes;
            const fineAmount = missingMinutes * salaryPerMinute;
            await prisma.fine.create({
                data: {
                    lateEntryFineHoursTime: convertMinutesToHHMM(missingMinutes),
                    lateEntryAmount: parseFloat(fineAmount.toFixed(2)),
                    punchRecord: { connect: { id: updatedPunchRecord.id } },
                    staff: { connect: { id: user.staffDetails.id } },
                },
            });
        } else if (gapMinutes > requiredMinutes) {
            const extraMinutes = gapMinutes - requiredMinutes;
            const overtimeAmount = extraMinutes * salaryPerMinute;
            await prisma.overtime.create({
                data: {
                    lateOutOvertimeHoursTime: convertMinutesToHHMM(extraMinutes),
                    lateOutOvertimeAmount: parseFloat(overtimeAmount.toFixed(2)),
                    punchRecord: { connect: { id: updatedPunchRecord.id } },
                    staff: { connect: { id: user.staffDetails.id } },
                },
            });
        }
        // If gap equals requiredMinutes exactly, no fine or overtime is applied.

        return res.status(201).json({ punchOut, punchRecord: updatedPunchRecord });
    } catch (error) {
        console.error("Error in createPunchOut:", error);
        if (error instanceof ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        return res
            .status(500)
            .json({ error: "Failed to create punch-out: " + error.message });
    }
}

/**
 * Get All Punch-Out Records API (GET)
 */
export async function getAllPunchOut(req, res) {
    try {
        const records = await prisma.punchOut.findMany({
            include: { punchRecords: true },
        });
        return res.status(200).json(records);
    } catch (error) {
        console.error("Error in getAllPunchOut:", error);
        return res
            .status(500)
            .json({ error: "Failed to retrieve punch-out records" });
    }
}

/**
 * Get Punch Records by Staff ID API (GET)
 */
export async function getPunchRecordById(req, res) {
    try {
        const { staffId } = req.params;
        const punchRecords = await prisma.punchRecords.findMany({
            where: { staffId },
            include: {
                fine: true,
                Overtime: true,
                punchIn: true,
                punchOut: true,
                staff: true,
            },
        });
        res.status(200).json(punchRecords);
    } catch (error) {
        console.error("Error in getPunchRecordById:", error);
        res.status(500).json({ error: "Failed to fetch punch records" });
    }
}

/**
 * Get Punch Records by Month/Year API (GET)
 * - Expects query parameters `month` and `year`.
 */
export async function getPunchRecords(req, res) {
    try {
        const { month, year } = req.query;
        let filter = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 1); // exclusive end date
            filter.punchDate = { gte: startDate, lt: endDate };
        }
        const punchRecords = await prisma.punchRecords.findMany({
            where: filter,
            include: {
                punchIn: true,
                punchOut: true,
                staff: true,
                fine: true,
                Overtime: true,
            },
        });
        if (punchRecords.length === 0) {
            return res.status(200).json({
                message: month && year
                    ? `No punch records found for ${month}-${year}.`
                    : "No punch records found.",
            });
        }
        // Calculate totals for various statuses
        let totalLeave = 0;
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalHalfDay = 0;
        punchRecords.forEach((record) => {
            switch (record.status) {
                case "LEAVE":
                    totalLeave++;
                    break;
                case "PRESENT":
                    totalPresent++;
                    break;
                case "ABSENT":
                    totalAbsent++;
                    break;
                case "HALF_DAY":
                    totalHalfDay++;
                    break;
                default:
                    break;
            }
        });
        return res.status(200).json({
            status: 200,
            message: `Punch records${month && year ? ` for ${month}-${year}` : ""}`,
            data: punchRecords,
            totals: { totalLeave, totalPresent, totalAbsent, totalHalfDay },
        });
    } catch (error) {
        console.error("Error in getPunchRecords:", error);
        res.status(500).json({ error: "Failed to fetch punch records" });
    }
}

/**
 * Update Punch Record Approval Status API (PUT)
 * - Accepts an array of staff IDs in the request body and updates their punch records to approved.
 */
export async function updatePunchRecordApproveStatus(req, res) {
    try {
        const { staffIds } = req.body;
        if (!Array.isArray(staffIds) || staffIds.length === 0) {
            return res.status(400).json({ error: "Invalid staffIds array." });
        }
        const punchRecords = await prisma.punchRecords.findMany({
            where: { staffId: { in: staffIds } },
        });
        if (punchRecords.length === 0) {
            return res
                .status(404)
                .json({ message: "No punch records found for approval." });
        }
        await Promise.all(
            punchRecords.map(async (record) => {
                await prisma.punchRecords.update({
                    where: { id: record.id },
                    data: { isApproved: true },
                });
            })
        );
        return res
            .status(200)
            .json({ message: "Approval status updated successfully." });
    } catch (error) {
        console.error("Error in updatePunchRecordApproveStatus:", error);
        return res
            .status(500)
            .json({ error: "Failed to update punch record approval status." });
    }
}
