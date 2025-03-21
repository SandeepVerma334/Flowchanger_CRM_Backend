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
            where: { adminId: req.userId },
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
            where: { id, adminId: req.userId },
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
            where: { id, adminId: req.userId },
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
            where: { id: { in: ids }, adminId: req.userId },
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
            where: { adminId: req.userId, departmentName: { contains: search, mode: "insensitive" } },
            page,
            limit,
        });

        res.status(200).json({ message: "Departments fetched successfully", ...departments });
    } catch (error) {
        next(error);
    }
};

/*************  ✨ Codeium Command ⭐  *************/
/**
 * Counts the number of departments associated with the authenticated admin user.
 * 
 * This function first verifies the admin status of the requesting user. If the
 * user is not an admin, a 401 Unauthorized response is returned. Upon successful
 * verification, it queries the database to count the number of departments linked
 * to the admin's user ID. The count is then sent in the response with a success
 * message. If any error occurs during the process, it is passed to the next
 * middleware for error handling.
 * 
 * @param {Object} req - The request object containing user details.
 * @param {Object} res - The response object used to send the count data.
 * @param {Function} next - The next middleware function in the stack.
 */

/******  a72bd44d-6424-419c-9da5-165ddc12e4af  *******/
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
