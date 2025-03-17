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
        console.log(admin)
        const { effectiveDate, salaryType, salaryStructure, ctcAmount, staffId, earnings, deductions, compliances } = req.body;

        if (!earnings || !earnings.basic) {
            return res.status(400).json({ error: "Earnings must include a basic salary." });
        }


        // Using Prisma transaction for consistency
        const salary = await prisma.$transaction(async (prisma) => {
            return await prisma.salaryDetail.create({
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
                    Staff: {
                        connect: {
                            id: staffId,
                        },
                    },
                },
                include: {
                    earnings: {
                        include: {
                            allowances: true
                        }
                    }, deductions: true, compliances: true
                },
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
            where: { id },
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
        await prisma.salaryDetail.delete({ where: { id } });
        res.status(200).json({ message: 'Salary record deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export { createSalary, getSalaries, updateSalary, deleteSalary }