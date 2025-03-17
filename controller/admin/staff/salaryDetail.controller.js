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
            where: whereClause,
            include: { earnings: true, deductions: true, compliances: true }
        });

        res.status(200).json({ message: 'Salaries fetched successfully', data: salaries });
    } catch (error) {
        next(error);
    }
};

const createSalary = async (req, res, next) => {
    try {
        const admin = checkAdmin(req.userId, "ADMIN");
        if (!admin) return res.status(403).json({ error: "Unauthorized" });

        const { effective_date, salary_type, ctc_amount, staffId, earnings = [], deductions = [], employerContributions = [], employeeContributions = [] } = req.body;

        if (!earnings.length) {
            return res.status(400).json({ error: "Earnings must be provided." });
        }

        const salary = await prisma.$transaction(async (prisma) => {
            return await prisma.salaryDetails.create({
                data: {
                    effective_date,
                    salary_type,
                    ctc_amount,
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
                            contribution_month: ec.contribution_month,
                            selected_earnings: ec.selected_earnings
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
                            contribution_month: ec.contribution_month,
                            selected_earnings: ec.selected_earnings
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

        res.status(201).json({ message: "Salary created successfully", data: salary });
    } catch (error) {
        next(error);
    }
};


const updateSalary = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { effective_date, salary_type, ctc_amount, staffId, earnings, deductions, employerContributions, employeeContributions } = req.body;

        const findSalary = await prisma.salaryDetails.findUnique({ where: { id } });
        if (!findSalary) {
            return res.status(404).json({ message: "Salary not found" });
        }

        const updatedSalary = await prisma.$transaction(async (prisma) => {
            await prisma.earnings.deleteMany({ where: { salaryDetailsId: id } });
            await prisma.deductions.deleteMany({ where: { salaryDetailsId: id } });
            await prisma.employerContribution.deleteMany({ where: { salaryDetailsId: id } });
            await prisma.employeeContribution.deleteMany({ where: { salaryDetailsId: id } });

            return await prisma.salaryDetails.update({
                where: { id },
                data: {
                    effective_date,
                    salary_type,
                    ctc_amount,
                    // staffId,
                    earnings: {
                        create: earnings.map(e => ({
                            heads: e.heads,
                            calculation: e.calculation,
                            amount: e.amount,
                            salary_month: e.salary_month
                        }))
                    },
                    deductions: {
                        create: deductions.map(d => ({
                            heads: d.heads,
                            calculation: d.calculation,
                            amount: d.amount,
                            deduction_month: d.deduction_month
                        }))
                    },
                    employerContribution: {
                        create: employerContributions.map(ec => ({
                            type: ec.type,
                            calculation: ec.calculation,
                            amount: ec.amount,
                            state: ec.state,
                            contribution_month: ec.contribution_month,
                            selected_earnings: ec.selected_earnings
                        }))
                    },
                    employeeContribution: {
                        create: employeeContributions.map(ec => ({
                            type: ec.type,
                            calculation: ec.calculation,
                            amount: ec.amount,
                            state: ec.state,
                            contribution_month: ec.contribution_month,
                            selected_earnings: ec.selected_earnings
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

// Delete Salary Detail
const deleteSalary = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.salaryDetail.delete({ where: { id } });
        res.status(200).json({ message: 'Salary record deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export { createSalary, getSalaries, updateSalary, deleteSalary }