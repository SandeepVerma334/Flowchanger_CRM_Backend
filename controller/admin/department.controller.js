import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import ZodError from "zod";
import { DepartmentSchema } from "../../utils/validation.js";

const createDepartment = async (req, res) => {
    try {
        const { departmentName } = req.body;
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        })
        if (!admin) {
            return res.status(400).json({
                status: false,
                message: "Admin not found",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({
                status: false,
                message: "Unauthorized access",
            });
        }
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
            data: { ...departmentResult.data, adminId: req.userId },
        });
        res.status(200).json({ department });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}

const getAllDepartments = async (req, res) => {
    try {
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        })
        if (!admin) {
            return res.status(400).json({
                status: false,
                message: "Admin not found",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({
                status: false,
                message: "Unauthorized access",
            });
        }
        const departments = await prisma.department.findMany({
            where: {
                adminId: req.userId,
            }
        });
        res.status(200).json({ departments });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}

const updateDepartment = async (req, res) => {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({
        where: {
            id: req.userId,
        },
    });

    if (!admin) {
        return res.status(400).json({
            message: "Admin not found!",
        });
    }
    if (admin.role !== "ADMIN") {
        return res
            .status(400)
            .json({ message: "Only admin can update department!" });
    }
    try {
        const { departmentName } = req.body;
        const validationResult = DepartmentSchema.safeParse({
            departmentName,
        });
        if (!validationResult.success) {
            return res.status(400).json({
                status: false,
                message: validationResult.error.issues[0].message,
            });
        }

        await prisma.department.update({
            where: {
                id,
            },
            data: {
                departmentName: validationResult.data.departmentName,
            },
        });
        return res.status(200).json({
            status: true,
            message: "Department Name Successfully Updated!(" + id + ")",
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: "Failed to update department",
            error: error.code,
        });
    }
};

// Delete Department By Id

const deleteDepartment = async (req, res) => {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({
        where: {
            id: req.userId,
        },
    });

    if (!admin) {
        return res.status(400).json({
            message: "Admin not found!",
        });
    }
    if (admin.role !== "ADMIN") {
        return res
            .status(400)
            .json({ message: "Only admin can delete department!" });
    }
    try {
        await prisma.department.delete({
            where: {
                id,
            },
        });
        return res.status(200).json({
            status: true,
            message: "Department Deleted Successfully!(" + id + ")",
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to delete department",
            error: error.code,
        });
    }
};

// Delete Department In Bulk
const deleteDepartmentsInBulk = async (req, res) => {
    try {
        const { departmentIds } = req.body;

        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        if (!admin) {
            return res.status(400).json({
                message: "Admin not found!",
            });
        }

        if (admin.role !== "ADMIN") {
            return res.status(400).json({
                message: "Only admin can delete departments!",
            });
        }

        if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
            return res.status(400).json({
                message: "Please provide an array of department IDs to delete.",
            });
        }

        await prisma.department.deleteMany({
            where: {
                id: {
                    in: departmentIds,
                },
                adminId: req.userId,
            },
        });

        return res.json({
            status: 200,
            message: "Departments deleted successfully!",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "An error occurred while deleting departments.",
        });
    }
};

// Show Department By Id

const showDepartment = async (req, res) => {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({
        where: {
            id: req.userId,
        },
    });

    if (!admin) {
        return res.status(400).json({
            message: "Admin not found!",
        });
    }
    if (admin.role !== "ADMIN") {
        return res
            .status(400)
            .json({ message: "Only admin can show department by id!" });
    }
    try {
        const showDepartment = await prisma.department.findUnique({
            where: {
                id,
            },
        });
        if (!showDepartment) {
            return res
                .status(404)
                .json({ status: false, message: "Department not found!" });
        }
        return res.status(200).json({
            status: true,
            message: "Department Show By ID!(" + id + ")",
            data: showDepartment,
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Failed to show department",
            error: error.message,
        });
    }
};

// Search Department Query............................
const searchDepartmentByName = async (req, res) => {
    try {
        const { departmentName } = req.query;
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        if (!admin) {
            return res.status(400).json({
                message: "Admin not found!",
            });
        }
        if (admin.role !== "ADMIN") {
            return res
                .status(400)
                .json({ message: "Only admin can find department!" });
        }
        const SearchDepartment = await prisma.department.findMany({
            where: {
                departmentName: {
                    contains: departmentName,
                    mode: "insensitive",
                },
                adminId: req.userId,
            },
        });
        return res.status(201).json(SearchDepartment);
    } catch (error) {
        console.error("Error adding department:", error);
        return res.status(500).json({
            status: false,
            message: "Failed to search department by name!" + error.message,
        });
    }
};

export { createDepartment, getAllDepartments, updateDepartment, deleteDepartment, deleteDepartmentsInBulk, showDepartment, searchDepartmentByName };