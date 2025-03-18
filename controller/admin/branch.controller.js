
import { pagination } from "../../utils/pagination.js";
import checkAdmin from "../../utils/adminChecks.js";
import prisma from "../../prisma/prisma.js";
import { BranchSchema } from "../../utils/validation.js";
const createBranch = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        const { branchName } = req.body;

        const validationData = BranchSchema.parse({ branchName });

        const branch = await prisma.branch.create({
            data: { ...validationData, adminId: req.userId },
        });

        res.status(200).json({ message: "Branch created successfully", data: branch });
    } catch (error) {
        next(error);
    }
};

const getAllBranches = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }
        const branches = await pagination(prisma.branch, {
            page,
            limit,
            where: { adminId: admin.id },
        });

        res.status(200).json({ message: "Branches fetched successfully", ...branches });
    } catch (error) {
        next(error);
    }
};

const updateBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { branchName } = req.body;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }
        const branchResult = BranchSchema.partial().parse({ branchName });

        const updatedBranch = await prisma.branch.update({
            where: { id, adminId: admin.id },
            data: { ...branchResult },
        });

        res.status(200).json({ message: "Branch updated successfully", data: updateBranch });
    } catch (error) {
        next(error);
    }
};

const deleteBranch = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }
        await prisma.branch.delete({
            where: { id, adminId: admin.id },
        });

        res.status(200).json({ message: "Branch deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const searchBranch = async (req, res, next) => {
    try {
        const { page, limit, search } = req.query;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        const branches = await pagination(prisma.branch, {
            page,
            limit,
            where: {
                adminId: admin.id,
                branchName: { contains: search, mode: "insensitive" },
            },
        });

        res.status(200).json({ message: "Branches fetched successfully", ...branches });
    } catch (error) {
        next(error);
    }
};

const bulkDeleteBranches = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const admin = await checkAdmin(req.userId);
        

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid branch IDs" });
        }

        await prisma.branch.deleteMany({
            where: { id: { in: ids }, adminId: admin.id },
        });

        res.status(200).json({ message: "Branches deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const countBranches = async (req, res, next) => {
    try {
        const admin = checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }
        const count = await prisma.branch.count({
            where: { adminId: admin.id },
        });
        res.status(200).json({ message: "Branch count fetched successfully", count });
    } catch (error) {
        next(error);
    }
}

export { createBranch, getAllBranches, updateBranch, deleteBranch, searchBranch, bulkDeleteBranches, countBranches };
