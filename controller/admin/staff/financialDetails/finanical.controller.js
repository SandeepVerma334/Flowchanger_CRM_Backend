import { StaffFinancialDetailsSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";

// create financial details
const createFinancialDetails = async (req, res, next) => {
    try {
        // Ensure checkAdmin is awaited
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }
        const validationData = StaffFinancialDetailsSchema.parse(req.body);

        // Check if bank account number already exists
        const checkBankAccountNumber = await prisma.financialDetails.findFirst({
            where: { accountNumber: validationData.accountNumber }
        });

        if (checkBankAccountNumber) {
            return res.status(400).json({ message: "Bank account number already exists" });
        }

        // Check if staffId already exists
        const checkStaffId = await prisma.financialDetails.findFirst({
            where: { staffId: validationData.staffId }
        });

        // if (checkStaffId) {
        //     return res.status(400).json({ message: "Staff ID already exists" });
        // }

        // Create financial details
        const financialDetails = await prisma.financialDetails.create({
            data: {
                ...validationData,
                adminId:  req.userId // Ensure the correct admin ID is used
            },
            include: {
                staffDetails: true
            }
        });

        res.status(201).json({
            message: "Financial details created successfully",
            data: financialDetails
        });

    } catch (error) {
        // console.error("Error creating financial details:", error);
        next(error);
    }
};

// get all Financial details

const getAllFinancialDetails = async (req, res, next) => {
    try {
        const admin = checkAdmin(req.userId, "ADMIN", res);
        const { page = 1, limit = 10 } = req.query;
        // const financialDetails = await prisma.financialDetails.findMany({
        const financialDetails = await pagination(prisma.financialDetails, {
            page, limit,
            where: {
                adminId: admin.id
            },
            include: {
                staffDetails: {
                    include: {
                        User: true
                    },
                },
            },
        });
        res.status(200).json({ message: "Financial details fetched successfully", data: financialDetails });
    } catch (error) {
        next(error);
    }
}

// get Financial details by id
const getFinancialDetailsById = async (req, res, next) => {
    try {
        const admin = checkAdmin(req.userId, "ADMIN", res);
        const { id } = req.params;
        const financialDetails = await prisma.financialDetails.findFirst({
            where: {
                id,
                adminId: admin.id
            },
            include: {
                staffDetails: {
                    include: {
                        User: true
                    },
                },
            },
        });
        res.status(200).json({ message: "Financial details fetched successfully", data: financialDetails });
    } catch (error) {
        next(error);
    }
}

// delete financial details by id
const deleteFinancialDetailsById = async (req, res, next) => {
    try {
        const admin = checkAdmin(req.userId, "ADMIN", res);
        const { id } = req.params;
        const financialDetails = await prisma.financialDetails.delete({
            where: {
                id,
                adminId: admin.id
            },
        });
        res.status(200).json({ message: "Financial details deleted successfully", data: financialDetails });
    } catch (error) {
        next(error);
    }
}

// update financial details by id
const updateFinancialDetailsById = async (req, res, next) => {
    try {        
        const admin = await checkAdmin(req.userId, "ADMIN");        
        const validationData = StaffFinancialDetailsSchema.parse(req.body);
        const { id } = req.params;

        // Check if the financial detail entry exists
        const existingFinancialDetail = await prisma.financialDetails.findUnique({
            where: { id }
        });

        if (!existingFinancialDetail) {
            return res.status(404).json({ message: "Financial details not found." });
        }

        if (validationData.accountNumber) {
            const existingAccount = await prisma.financialDetails.findFirst({
                where: {
                    accountNumber: validationData.accountNumber,
                    NOT: { id }
                }
            });
            if (existingAccount) {
                return res.status(400).json({ message: "Another entry with this account number already exists." });
            }
        }
        if (validationData.staffId) {
            const existingStaff = await prisma.financialDetails.findFirst({
                where: {
                    staffId: validationData.staffId,
                    NOT: { id }
                }
            });
            if (existingStaff) {
                return res.status(400).json({ message: "This staff member already has a financial details entry." });
            }
        }

        // Update financial details
        const updatedFinancialDetails = await prisma.financialDetails.update({
            where: { id },
            data: validationData,
        });

        return res.status(200).json({
            message: "Financial details updated successfully",
            data: updatedFinancialDetails
        });

    } catch (error) {
        next(error);
    }
};

export { createFinancialDetails, getAllFinancialDetails, getFinancialDetailsById, deleteFinancialDetailsById, updateFinancialDetailsById };
