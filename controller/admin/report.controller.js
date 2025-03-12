
import prisma from "../../prisma/prisma.js";
import { pagination } from '../../utils/pagination.js';
import { reportSchema } from "../../utils/validation.js";
import jwt from 'jsonwebtoken';

const getAllReports = async (req, res, next) => {
    try {
        const { adminId, userId, page, limit } = req.query;
        const superAdmin = await prisma.superAdminDetails.findFirst();

        let where = {};

        if (adminId) {
            where.adminId = adminId;
        } else if (userId) {
            where.userId = userId;
        } else if (!superAdmin || superAdmin.role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }

        // Fetch reports where token exists
        const oldReports = await prisma.report.findMany({ where, select: { id: true, token: true } });

        // Find expired tokens and update their status
        const expiredReportIds = oldReports
            .filter(report => {
                const decodedToken = jwt.decode(report.token);
                return decodedToken?.exp * 1000 < Date.now();
            })
            .map(report => report.id);

        if (expiredReportIds.length > 0) {
            await prisma.report.updateMany({
                where: { id: { in: expiredReportIds } },
                data: { status: "REJECTED", token: "" }
            });
        }

        // Get paginated reports
        const allReport = await pagination(prisma.report, { page, limit, where });

        res.status(200).json({ message: "Reports fetched successfully", ...allReport });
    } catch (error) {
        next(error);
    }
};



const getReportById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const report = await prisma.report.findUnique({ where: { id } });
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        res.status(200).json({ message: "Report found successfully", data: report });
    } catch (error) {
        next(error);
    }
}

const createReport = async (req, res, next) => {
    try {
        const validationData = reportSchema.parse(req.body);
        const token = jwt.sign({ adminId: validationData.adminId, userId: validationData.userId }, process.env.JWT_SECRET, { expiresIn: '1m' });
        const latestReport = await prisma.report.findFirst({
            where: {
                userId: validationData.userId,
                // status: "REJECTED"
            },
            orderBy: {
                createdAt: "desc" // Get the latest rejected report
            }
        });

        console.log(latestReport);
        let newReport;

        if (latestReport && latestReport.status !== "RESOLVED") {
            // Update the latest rejected report
            const { status, ...updateField } = latestReport;
            newReport = await prisma.report.update({
                where: { id: latestReport.id },
                data: {
                    ...updateField,
                    token: token,
                    status: "PENDING",
                }
            });
        } else {
            // Create a new report if no rejected report exists
            newReport = await prisma.report.create({
                data: {
                    ...validationData,
                    token: token
                }
            });
        }

        res.status(200).json({ message: "Report created successfully", data: newReport });
    } catch (error) {
        next(error);
    }
};

const updateReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const findReport = await prisma.report.findUnique({ where: { id } });
        if (!findReport) {
            return res.status(404).json({ message: "Report not found" });
        }
        const validationData = reportSchema.partial().parse(req.body);
        const updatedReport = await prisma.report.update({
            where: { id },
            data: {
                ...validationData,
                ...(validationData.status === "RESOLVED" || validationData.status === "REJECTED"
                    ? { token: "" } // Use `null` instead of an empty string if you want to remove the token
                    : {}
                )
            }
        });
        res.status(200).json({ message: "Report updated successfully", data: updatedReport });
    } catch (error) {
        next(error);
    }
};

const deleteReport = async (req, res, next) => {
    try {
        const { id } = req.params;
        const findReport = await prisma.report.findUnique({ where: { id } });
        if (!findReport) {
            return res.status(404).json({ message: "Report not found" });
        }
        await prisma.report.delete({ where: { id } });
        res.status(200).json({ message: "Report deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const searchReports = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, status, adminId, userId } = req.query;
        const superAdmin = await prisma.superAdminDetails.findFirst();
        let where = {};

        // Apply filters based on role
        if (adminId) {
            where.adminId = adminId;
        } else if (userId) {
            where.userId = userId;
        } else if (!superAdmin || superAdmin.role !== "SUPERADMIN") {
            return res.status(403).json({ message: "Access denied" });
        }

        // Apply search filters
        if (status) where.status = status;
        if (search) {
            where = {
                ...where,
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                    { subject: { contains: search, mode: "insensitive" } }
                ]
            }
        }
        const oldReports = await prisma.report.findMany({
            where
        });

        await oldReports.forEach(async (report) => {
            const decodedToken = jwt.verify(report.token, process.env.JWT_SECRET);
            if (decodedToken?.iat >= decodedToken?.exp) {
                await prisma.report.update({ where: { id: report.id }, data: { status: "EXPIRED", token: null } });
            }
        })

        // Fetch reports with pagination
        const allReports = await pagination(prisma.report, { page, limit, where });

        res.status(200).json({ message: "Reports found successfully", ...allReports });
    } catch (error) {
        next(error);
    }
};


export { createReport, deleteReport, getAllReports, getReportById, searchReports, updateReport };

