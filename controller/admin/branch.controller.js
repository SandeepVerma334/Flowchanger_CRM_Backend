import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import ZodError from "zod";
import { BranchSchema } from "../../utils/validation.js";

export const createBranch = async (req, res) => {
    try {
        const { branchName } = req.body;
        const branchResult = BranchSchema.safeParse({
            branchName,
        });
        if (!branchResult.success) {
            return res.status(400).json({
                status: false,
                message: branchResult.error.issues[0].message,
            });
        }
        const branch = await prisma.branch.create({
            data: branchResult.data,
        });
        res.status(200).json({ branch });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}

export const getAllBranches = async (req, res) => {
    try {
        const branches = await prisma.branch.findMany();
        res.status(200).json({ branches });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}