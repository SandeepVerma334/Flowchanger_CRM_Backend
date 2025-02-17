import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import ZodError from "zod";
import { DepartmentSchema } from "../../utils/validation.js";

export const createDepartment = async (req, res) => {
    try {
        const { departmentName } = req.body;
        const departmentResult = DepartmentSchema.safeParse({
            departmentName,
        });
        if (!departmentResult.success) {
            return res.status(400).json({
                status: false,
                message: departmentResult.error.issues[0].message,
            });
        }
        const department = await prisma.department.create({
            data: departmentResult.data,
        });
        res.status(200).json({ department });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}

export const getAllDepartments = async (req, res) => {
    try {
        const departments = await prisma.department.findMany();
        res.status(200).json({ departments });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}