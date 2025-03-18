import prisma from "../../prisma/prisma.js";
import { pagination } from "../../utils/pagination.js";
import checkAdmin from "../../utils/adminChecks.js";
import { DepartmentSchema } from "../../utils/validation.js";

const createDepartment = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        const { departmentName } = req.body;
        const validationData = DepartmentSchema.parse({ departmentName });

        const department = await prisma.department.create({
            data: { ...validationData, adminId: req.userId },
        });

        res.status(200).json({ message: "Department created successfully", data: department });
    } catch (error) {
        next(error);
    }
};

const getAllDepartments = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        const departments = await pagination(prisma.department, {
            page,
            limit,
            where: { adminId: admin.id },
        });

        res.status(200).json({ message: "Departments fetched successfully", ...departments });
    } catch (error) {
        next(error);
    }
};

const updateDepartment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { departmentName } = req.body;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        const validationData = DepartmentSchema.partial().parse({ departmentName });

        const updatedDepartment = await prisma.department.update({
            where: { id, adminId: admin.id },
            data: validationData,
        });

        res.status(200).json({ message: "Department updated successfully", data: updatedDepartment });
    } catch (error) {
        next(error);
    }
};

const deleteDepartment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        await prisma.department.delete({
            where: { id, adminId: admin.id },
        });

        res.status(200).json({ message: "Department deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const bulkDeleteDepartments = async (req, res, next) => {
    try {
        const { ids } = req.body;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid department IDs" });
        }

        await prisma.department.deleteMany({
            where: { id: { in: ids }, adminId: admin.id },
        });

        res.status(200).json({ message: "Departments deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const searchDepartment = async (req, res, next) => {
    try {
        const { page, limit, search } = req.query;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }

        const departments = await pagination(prisma.department, {
            where: { adminId: admin.id, departmentName: { contains: search, mode: "insensitive" } },
            page,
            limit,
        });

        res.status(200).json({ message: "Departments fetched successfully", ...departments });
    } catch (error) {
        next(error);
    }
};

const countDepartments = async (req, res, next) => {
    try {
        const admin = checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }
        const count = await prisma.department.count({
            where: { adminId: req.userId },
        });

        res.status(200).json({ message: "Department count fetched successfully", count });
    } catch (error) {
        next(error);
    }
};
export { createDepartment, getAllDepartments, updateDepartment, deleteDepartment, bulkDeleteDepartments, searchDepartment, countDepartments };
