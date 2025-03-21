import { error } from "pdf-lib";
import prisma from "../../../prisma/prisma.js";
import checkAdmin from "../../../utils/adminChecks.js";
import { pagination } from "../../../utils/pagination.js";
import { SalarySchema } from "../../../utils/validation.js";


const createSalary = async (req, res, next) => {
    try {
        const validationData = SalarySchema.parse(req.body);
        const admin = await checkAdmin(req.userId, "ADMIN");
        if (admin.error) return res.status(403).json({ error: admin.message });

        const { effectiveDate, salaryType, ctcAmount, staffId, earnings = [], deductions = [], employerContributions = [], employeeContributions = [] } = req.body;

        if (!earnings.length) {
            return res.status(400).json({ error: "Earnings must be provided." });
        }

        const findEffectiveDateSalary = await prisma.salaryDetail.findFirst({
            where: {
                AND: [
                    { effectiveDate: new Date(new Date(effectiveDate).setDate(15)) },
                    { adminId: admin.user.adminDetails.id },
                    { staffId: staffId }
                ]
            }
        });
        if (findEffectiveDateSalary) {
            return res.status(400).json({ error: "Salary for this date already exists." });
        }
        const findStaff = await prisma.staffDetails.findUnique({ where: { id: staffId } });
        if (!findStaff) return res.status(404).json({ message: "Staff not found" });


        const salary = await prisma.$transaction(async (prisma) => {
            return await prisma.salaryDetail.create({
                data: {
                    effectiveDate: new Date(new Date(effectiveDate).setDate(15)),
                    salaryType,
                    ctcAmount,
                    adminId: req.userId,
                    Staff: {
                        connect: { id: staffId }
                    },
                    earnings: {
                        create: earnings.map(e => ({
                            staff: {
                                connect: { id: staffId }
                            },
                            heads: e.heads,
                            calculation: e.calculation,
                            amount: e.amount,
                            salaryMonth: e.salaryMonth
                        }))
                    },
                    ...(deductions.length > 0 && {
                        deductions: {
                            create: deductions.map(d => ({
                                staff: {
                                    connect: { id: staffId }
                                },
                                heads: d.heads,
                                calculation: d.calculation,
                                amount: d.amount,
                                deductionMonth: d.deductionMonth
                            }))
                        }
                    }),
                    ...(employerContributions.length > 0 && {
                        employerContribution: {
                            create: employerContributions.map(ec => ({
                                staff: {
                                    connect: { id: staffId }
                                },
                                type: ec.type,
                                calculation: ec.calculation,
                                amount: ec.amount,
                                state: ec.state,
                                contributionMonth: ec.contributionMonth,
                                selectedEarnings: ec.selectedEarnings
                            }))
                        },
                    }),
                    ...(employeeContributions.length > 0 && {
                        employeeContribution: {
                            create: employeeContributions.map(ec => ({
                                staff: {
                                    connect: { id: staffId }
                                },
                                type: ec.type,
                                calculation: ec.calculation,
                                amount: ec.amount,
                                state: ec.state,
                                contributionMonth: ec.contributionMonth,
                                selectedEarnings: ec.selectedEarnings
                            }))
                        }
                    })
                },
                include: {
                    earnings: true,
                    deductions: true,
                    employerContribution: true,
                    employeeContribution: true
                }
            });
        });

        res.status(201).json({ message: "Salary created successfully", data: salary });
    } catch (error) {
        next(error);
    }
};


const updateSalary = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { effectiveDate, salaryType, ctcAmount, staffId, earnings, deductions, employerContributions, employeeContributions } = req.body;

        const validationData = SalarySchema.partial().parse(req.body);
        const findSalary = await prisma.salaryDetail.findUnique({ where: { id } });
        if (!findSalary) {
            return res.status(404).json({ message: "Salary not found" });
        }

        const findStaff = await prisma.staffDetails.findUnique({ where: { id: staffId } });
        if (!findStaff) return res.status(404).json({ message: "Staff not found" });

        const updatedSalary = await prisma.$transaction(async (prisma) => {
            await prisma.earnings.deleteMany({ where: { salaryDetailsId: id } });
            await prisma.deductions.deleteMany({ where: { salaryDetailsId: id } });
            await prisma.employerContribution.deleteMany({ where: { salaryDetailsId: id } });
            await prisma.employeeContribution.deleteMany({ where: { salaryDetailsId: id } });

            return await prisma.salaryDetail.update({
                where: { id },
                data: {
                    effectiveDate,
                    salaryType,
                    ctcAmount,
                    earnings: {
                        create: earnings.map(e => ({
                            staff: {
                                connect: { id: staffId }
                            },
                            heads: e.heads,
                            calculation: e.calculation,
                            amount: e.amount,
                            salaryMonth: e.salaryMonth
                        }))
                    },
                    deductions: {
                        create: deductions.map(d => ({
                            staff: {
                                connect: { id: staffId }
                            },
                            heads: d.heads,
                            calculation: d.calculation,
                            amount: d.amount,
                            deductionMonth: d.deductionMonth
                        }))
                    },
                    employerContribution: {
                        create: employerContributions.map(ec => ({
                            staff: {
                                connect: { id: staffId }
                            },
                            type: ec.type,
                            calculation: ec.calculation,
                            amount: ec.amount,
                            state: ec.state,
                            contributionMonth: ec.contributionMonth,
                            selectedEarnings: ec.selectedEarnings
                        }))
                    },
                    employeeContribution: {
                        create: employeeContributions.map(ec => ({
                            staff: {
                                connect: { id: staffId }
                            },
                            type: ec.type,
                            calculation: ec.calculation,
                            amount: ec.amount,
                            state: ec.state,
                            contributionMonth: ec.contributionMonth,
                            selectedEarnings: ec.selectedEarnings
                        }))
                    }
                },
                include: {
                    earnings: true,
                    deductions: true,
                    employerContribution: true,
                    employeeContribution: true
                }
            });
        });

        res.status(200).json({ message: 'Salary updated successfully', data: updatedSalary });
    } catch (error) {
        next(error);
    }
};

const createORUpdateSalary = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN");
        if (admin.error) return res.status(403).json({ error: admin.message });
        const {
            effectiveDate,
            salaryType,
            ctcAmount,
            staffId,
            employerPf,
            employerEsi,
            employerLwf,
            employeePf,
            employeeEsi,
            professionalTax,
            employeeLwf,
            payrollFinalized,
            finalizedDate,
            finalSalary,
            tds,
            earnings = [],
            deductions = [],
            employerContributions = [],
            employeeContributions = []
        } = req.body;

        // Validate request body
        const validationData = SalarySchema.partial().parse(req.body);

        // Check if staff exists
        const findStaff = await prisma.staffDetails.findUnique({
            where: { id: staffId, adminId: admin.user.adminDetails.id },
            include: { SalaryDetails: true }
        });


        if (!findStaff) return res.status(404).json({ message: "Staff not found" });

        let salary;
        let id = null;

        // Find existing salary by effectiveDate
        const findSalary = await prisma.salaryDetail.findFirst({
            where: { staffId: staffId, effectiveDate }
        });

        if (findSalary) {
            id = findSalary.id;

            salary = await prisma.$transaction(async (prisma) => {
                // Delete old salary details before updating
                await prisma.earnings.deleteMany({ where: { salaryDetailsId: id } });
                await prisma.deductions.deleteMany({ where: { salaryDetailsId: id } });
                await prisma.employerContribution.deleteMany({ where: { salaryDetailsId: id } });
                await prisma.employeeContribution.deleteMany({ where: { salaryDetailsId: id } });

                return await prisma.salaryDetail.update({
                    where: { id },
                    data: {
                        effectiveDate: new Date(new Date(effectiveDate).setDate(15)),
                        salaryType,
                        ctcAmount,
                        employerPf,
                        employerEsi,
                        employerLwf,
                        employeePf,
                        employeeEsi,
                        professionalTax,
                        employeeLwf,
                        earnings: { create: earnings.map(e => ({ ...e, staffId })) },
                        deductions: deductions.length > 0 ? { create: deductions.map(d => ({ ...d, staffId })) } : undefined,
                        employerContribution: employerContributions.length > 0 ? { create: employerContributions.map(ec => ({ ...ec, staffId })) } : undefined,
                        employeeContribution: employeeContributions.length > 0 ? { create: employeeContributions.map(ec => ({ ...ec, staffId })) } : undefined
                    },
                    include: { earnings: true, deductions: true, employerContribution: true, employeeContribution: true }
                });
            });
        } else {
            // Creating new salary
            salary = await prisma.$transaction(async (prisma) => {
                return await prisma.salaryDetail.create({
                    data: {
                        effectiveDate: new Date(new Date(effectiveDate).setDate(15)),
                        salaryType,
                        ctcAmount,
                        employerPf,
                        employerEsi,
                        employerLwf,
                        employeePf,
                        employeeEsi,
                        professionalTax,
                        employeeLwf,
                        adminId: req.userId,
                        Staff: { connect: { id: staffId } },
                        earnings: { create: earnings.map(e => ({ ...e, staffId })) },
                        deductions: deductions.length > 0 ? { create: deductions.map(d => ({ ...d, staffId })) } : undefined,
                        employerContribution: employerContributions.length > 0 ? { create: employerContributions.map(ec => ({ ...ec, staffId })) } : undefined,
                        employeeContribution: employeeContributions.length > 0 ? { create: employeeContributions.map(ec => ({ ...ec, staffId })) } : undefined
                    },
                    include: { earnings: true, deductions: true, employerContribution: true, employeeContribution: true }
                });
            });
        }

        res.status(200).json({ message: id ? "Salary updated successfully" : "Salary created successfully", data: salary });

    } catch (error) {
        next(error);
    }
};


// Delete Salary Detail
const deleteSalary = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.salaryDetail.delete({ where: { id, adminId: req.userId } });
        res.status(200).json({ message: 'Salary record deleted successfully' });
    } catch (error) {
        next(error);
    }
};

const getSalaryForAdmin = async (req, res, next) => {
    try {
        const { date, type } = req.query;
        const isAdmin = await checkAdmin(req.userId);
        if (isAdmin.error) {
            return res.status(401).json({ message: isAdmin.message });
        }

        let startDate, endDate;

        if (type === "monthly") {
            startDate = new Date(date);
            startDate.setUTCDate(1);
            startDate.setUTCHours(0, 0, 0, 0);

            endDate = new Date(date);
            endDate.setUTCDate(15);
            endDate.setUTCHours(23, 59, 59, 999);

        } else if (type === "yearly") {
            startDate = new Date(date);
            startDate.setUTCMonth(0, 1);
            startDate.setUTCHours(0, 0, 0, 0);

            endDate = new Date(date);
            endDate.setUTCMonth(11, 31);
            endDate.setUTCHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({ message: "Invalid salary type. Use 'monthly' or 'yearly'." });
        }



        const salary = await pagination(prisma.salaryDetail, {
            where: {
                adminId: req.userId,
                effectiveDate: {
                    gte: startDate,
                    lte: endDate,
                }
            }
        });

        return res.status(200).json({
            message: `Salary details retrieved successfully for admin for ${type} `,
            ...salary
        });
    } catch (error) {
        next(error);
    }
};


const getSalaryForStaff = async (req, res, next) => {
    try {
        const { date, type } = req.query;
        const isStaff = await checkAdmin(req.userId, "STAFF");
        if (isStaff.error) {
            return res.status(401).json({ message: isStaff.message });
        }

        let startDate, endDate;

        if (type === "monthly") {
            startDate = new Date(date);
            startDate.setUTCDate(1);
            startDate.setUTCHours(0, 0, 0, 0);

            endDate = new Date(date);
            endDate.setUTCDate(15);
            endDate.setUTCHours(23, 59, 59, 999);

        } else if (type === "yearly") {
            startDate = new Date(date);
            startDate.setUTCMonth(0, 1);
            startDate.setUTCHours(0, 0, 0, 0);

            endDate = new Date(date);
            endDate.setUTCMonth(11, 31);
            endDate.setUTCHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({ message: "Invalid salary type. Use 'monthly' or 'yearly'." });
        }



        const salary = await pagination(prisma.salaryDetail, {
            where: {
                staffId: isStaff.user.StaffDetails.id,
                effectiveDate: {
                    gte: startDate,
                    lte: endDate,
                }
            }
        });

        return res.status(200).json({
            message: `Salary details retrieved successfully for staff for ${type} `,
            ...salary
        });
    } catch (error) {
        next(error);
    }
};

const getSalaryForSingleStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { date, type } = req.query;
        const isAdmin = await checkAdmin(req.userId);
        if (isAdmin.error) {
            return res.status(401).json({ message: isAdmin.message });
        }

        let startDate, endDate;

        if (type === "monthly") {
            startDate = new Date(date);
            startDate.setUTCDate(1);
            startDate.setUTCHours(0, 0, 0, 0);

            endDate = new Date(date);
            endDate.setUTCDate(15);
            endDate.setUTCHours(23, 59, 59, 999);

        } else if (type === "yearly") {
            startDate = new Date(date);
            startDate.setUTCMonth(0, 1);
            startDate.setUTCHours(0, 0, 0, 0);

            endDate = new Date(date);
            endDate.setUTCMonth(11, 31);
            endDate.setUTCHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({ message: "Invalid salary type. Use 'monthly' or 'yearly'." });
        }



        const salary = await pagination(prisma.salaryDetail, {
            where: {
                staffId: id,
                adminId: req.userId,
                effectiveDate: {
                    gte: startDate,
                    lte: endDate,
                }
            }
        });

        return res.status(200).json({
            message: `Salary details retrieved successfully for specific staff for ${type} `,
            ...salary
        });
    } catch (error) {
        next(error);
    }
};

const bulkSalaryCreateOrUpdate = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN");
        if (admin.error) return res.status(403).json({ error: admin.message });

        const salaryData = req.body.salaries;
        if (!Array.isArray(salaryData) || salaryData.length === 0) {
            return res.status(400).json({ error: "Invalid salary data." });
        }

        const transactions = [];

        for (const data of salaryData) {
            const { effectiveDate, salaryType, ctcAmount, staffId, earnings = [], deductions = [], employerContributions = [], employeeContributions = [] } = data;
            const formattedDate = new Date(new Date(effectiveDate).setDate(15));

            const existingSalary = await prisma.salaryDetail.findFirst({
                where: { staffId, effectiveDate: formattedDate }
            });

            if (existingSalary) {
                // Update Logic
                transactions.push(
                    prisma.salaryDetail.update({
                        where: { id: existingSalary.id },
                        data: {
                            ctcAmount,
                            salaryType,
                            earnings: {
                                deleteMany: { staffId },
                                create: earnings.map(e => ({ ...e, staffId }))
                            },
                            deductions: {
                                deleteMany: { staffId },
                                create: deductions.map(d => ({ ...d, staffId }))
                            },
                            employerContribution: {
                                deleteMany: { staffId },
                                create: employerContributions.map(ec => ({ ...ec, staffId }))
                            },
                            employeeContribution: {
                                deleteMany: { staffId },
                                create: employeeContributions.map(ec => ({ ...ec, staffId }))
                            }
                        },
                        include: {
                            earnings: true,
                            deductions: true,
                            employerContribution: true,
                            employeeContribution: true
                        }
                    })
                );
            } else {
                // Create Logic
                transactions.push(
                    prisma.salaryDetail.create({
                        data: {
                            effectiveDate: formattedDate,
                            salaryType,
                            ctcAmount,
                            adminId: req.userId,
                            staffId,
                            earnings: { create: earnings.map(e => ({ ...e, staffId })) },
                            deductions: { create: deductions.map(d => ({ ...d, staffId })) },
                            employerContribution: { create: employerContributions.map(ec => ({ ...ec, staffId })) },
                            employeeContribution: { create: employeeContributions.map(ec => ({ ...ec, staffId })) }
                        },
                        include: {
                            earnings: true,
                            deductions: true,
                            employerContribution: true,
                            employeeContribution: true
                        }
                    })
                );
            }
        }

        const processedSalaries = await prisma.$transaction(transactions);

        res.status(200).json({ message: "Bulk salary processed successfully.", data: processedSalaries });
    } catch (error) {
        next(error);
    }
};


export { createSalary, updateSalary, deleteSalary, getSalaryForAdmin, getSalaryForStaff, getSalaryForSingleStaff, bulkSalaryCreateOrUpdate, createORUpdateSalary }