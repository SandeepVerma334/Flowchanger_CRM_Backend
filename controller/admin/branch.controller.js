import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import ZodError from "zod";
import { BranchSchema } from "../../utils/validation.js";

const createBranch = async (req, res) => {
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
        const branch = await prisma.branch.create({
            data: { ...branchResult.data, adminId: req.userId },
        });
        res.status(200).json({ branch });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}

const getAllBranches = async (req, res) => {
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
        const branches = await prisma.branch.findMany({
            where: {
                adminId: req.userId,
            }
        });
        res.status(200).json({ branches });
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error.message });
    }
}

const deleteBranch = async (req, res) => {
    try {
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
            return res.status(400).json({ message: "Only admin can delete branch!" });
        }
        const deletedBranch = await prisma.branch.delete({
            where: { id: id },
        });
        res
            .status(200)
            .json({ message: "Branch deleted successfully", deletedBranch });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Failed to delete branch" });
    }
};

const updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                status: false,
                message: "Branch id is required",
            });
        }
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
            return res.status(400).json({ message: "Only admin can update branch!" });
        }
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

        const updatedBranch = await prisma.branch.update({
            where: { id: id },
            data: { branchName: branchResult.data.branchName },
        });

        res
            .status(200)
            .json({ message: "Branch updated successfully", updatedBranch });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Failed to update branch" });
    }
};
// Branch Search API's Create

const searchBranch = async (req, res) => {
    try {
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
            return res.status(400).json({ message: "Only admin can search branch!" });
        }
        const { branchName } = req.query;
        const branches = await prisma.branch.findMany({
            where: {
                adminId: req.userId,
                branchName: {
                    contains: branchName,
                    mode: "insensitive",
                },
            },
        });
        res.status(200).json(branches);
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Failed to search branch" });
    }
};

// count branch API

const branchCount = async (req, res) => {
    try {
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
            return res.status(400).json({ message: "Only admin can count branch!" });
        }
        const count = await prisma.branch.count({
            where: {
                adminId: req.userId,
            },
        });
        res
            .status(200)
            .json({ message: "Successfully fetched branch count", count });
    } catch (error) {
        // console.log(error);
        res.status(500).json({ message: "Failed to count branch" });
    }
};

// Search Department Query............................
const searchBranchByName = async (req, res) => {
    try {
        const { branchName } = req.query;
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
        const searchBranch = await prisma.branch.findMany({
            where: {
                branchName: {
                    contains: branchName,
                    mode: "insensitive",
                },
                adminId: req.userId,
            },
        });
        return res.status(201).json(searchBranch);
    } catch (error) {
        console.error("Error adding department:", error);
        return res.status(500).json({
            status: false,
            message: "Failed to search department by name!" + error.message,
        });
    }
};

// Delete Branch In Bulk
const deleteBranchInBulk = async (req, res) => {
    try {
        const { branchIds } = req.body;

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

        if (!Array.isArray(branchIds) || branchIds.length === 0) {
            return res.status(400).json({
                message: "Please provide an array of department IDs to delete.",
            });
        }

        await prisma.branch.deleteMany({
            where: {
                id: {
                    in: branchIds,
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

export { createBranch, getAllBranches, deleteBranch, updateBranch, searchBranch, branchCount, searchBranchByName, deleteBranchInBulk };