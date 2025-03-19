import prisma from "../../../prisma/prisma.js";
import checkAdmin from "../../../utils/adminChecks.js";

// Create Salary Detail

// Get Salary by Staff ID or Month

const getSalaries = async (req, res, next) => {
    try {
        const { staffId, month } = req.query;
        const whereClause = {};
        if (staffId) whereClause.staffId = staffId;
        if (month) whereClause.effectiveDate = { gte: new Date(`${month}-01`), lt: new Date(`${month}-31`) };

        const salaries = await prisma.salaryDetail.findMany({
            where: whereClause, adminId: req.userId,
            include: { earnings: true, deductions: true, compliances: true }
        });

        res.status(200).json({ message: 'Salaries fetched successfully', data: salaries });
    } catch (error) {
        next(error);
    }
};

const createSalary = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN");
        if (admin.error) return res.status(403).json({ error: admin.message });

        const { effective_date, salary_type, ctc_amount, staffId, earnings = [], deductions = [], employerContributions = [], employeeContributions = [] } = req.body;

        if (!earnings.length) {
            return res.status(400).json({ error: "Earnings must be provided." });
        }

        const findEffectiveDateSalary = await prisma.salaryDetail.findFirst({ where: { effective_date: new Date(new Date(effective_date).setDate(15)) } });
        if (findEffectiveDateSalary) {
            return res.status(400).json({ error: "Salary for this date already exists." });
        }
        const findStaff = await prisma.staffDetails.findUnique({ where: { id: staffId } });
        if (!findStaff) return res.status(404).json({ message: "Staff not found" });


        const salary = await prisma.$transaction(async (prisma) => {
            return await prisma.salaryDetail.create({
                data: {
                    effective_date: new Date(new Date(effective_date).setDate(15)),
                    salary_type,
                    ctc_amount,
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
                            salary_month: e.salary_month
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
                                deduction_month: d.deduction_month
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
                                contribution_month: ec.contribution_month,
                                selected_earnings: ec.selected_earnings
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
                                contribution_month: ec.contribution_month,
                                selected_earnings: ec.selected_earnings
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
// Update Salary Detail
const updateSalary = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { effectiveDate, salaryType, salaryStructure, ctcAmount, staffId, earnings, deductions, compliances } = req.body;

        const findSalary = await prisma.salaryDetail.findUnique({
            where: { id, adminId: req.userId },
        })
        if (!findSalary) {
            return res.status(404).json({
                message: "Salary not found",
            })
        }
        const updatedSalary = await prisma.$transaction(async (prisma) => {
            // Update salary details

            await prisma.earnings.delete({ where: { salaryDetailId: id } });
            await prisma.deduction.deleteMany({ where: { salaryDetailId: id } });
            await prisma.compliances.delete({ where: { salaryDetailId: id } });

            return await prisma.salaryDetail.update({
                where: { id },
                data: {
                    effectiveDate,
                    salaryType,
                    salaryStructure,
                    ctcAmount,
                    Staff: {
                        connect: {
                            id: staffId
                        }
                    },
                    earnings: {
                        create: {
                            basic: earnings.basic,
                            basicCalculation: earnings.basicCalculation,
                            allowances: {
                                create: earnings.allowances.map((a) => ({
                                    calculation: a.calculation,
                                    amount: a.amount,
                                    name: a.name
                                }))
                            }
                        },
                    },
                    deductions: {
                        create: deductions || [],
                    },
                    compliances: {
                        create: compliances || {},
                    },
                },
                include: {
                    earnings: { include: { allowances: true } },
                    deductions: true,
                    compliances: true
                },
            });
        });
        res.status(200).json({ message: 'Salary updated successfully', data: updatedSalary });
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

export { createSalary, getSalaries, updateSalary, deleteSalary }