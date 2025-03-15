import prisma from "../../../prisma/prisma.js";

// Create Salary Detail
const createSalary = async (req, res, next) => {

    

    try {
        const { effectiveDate, salaryType, salaryStructure, ctcAmount, staffId, earnings, deductions, compliances } = req.body;

        if (!earnings || !earnings.basic) {
            return res.status(400).json({ error: "Earnings must include a basic salary." });
        }

        // Default values if fields are missing
        const allowances = earnings.allowances || [];
        const totalEarnings = earnings.basic + allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
        const totalDeductions = (deductions || []).reduce((sum, d) => sum + (d.amount || 0), 0);
        const totalCompliances = compliances ? Object.values(compliances).reduce((sum, c) => sum + (c || 0), 0) : 0;
        const netSalary = totalEarnings - (totalDeductions + totalCompliances);

        // Using Prisma transaction for consistency
        const salary = await prisma.$transaction(async (prisma) => {
            return await prisma.salaryDetail.create({
                data: {
                    effectiveDate,
                    salaryType,
                    salaryStructure,
                    ctcAmount,
                    staffId,
                    netSalary,
                    earnings: { create: earnings },
                    deductions: { create: deductions || [] },
                    compliances: { create: compliances || {} }
                },
                include: { earnings: true, deductions: true, compliances: true }
            });
        });

        res.status(201).json({ message: "Salary created successfully", data: salary });

    } catch (error) {
        next(error);
    }
};

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

// Update Salary Detail
const updateSalary = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedSalary = await prisma.salaryDetail.update({
            where: { id },
            data,
            include: { earnings: true, deductions: true, compliances: true }
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