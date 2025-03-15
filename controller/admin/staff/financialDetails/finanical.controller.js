import { StaffFinancialDetailsSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";

// create financial details
const createFinancialDetails = async (req, res, next) => {
    try {
        const admin = checkAdmin(req.userId, "ADMIN", res);
        const validationData = StaffFinancialDetailsSchema.parse(req.body);

        // Check bank account number already exists
        const checkBankAccountNumber = await prisma.financialDetails.findFirst({
            where: {
                accountNumber: validationData.accountNumber
            }
        });
        if (checkBankAccountNumber) {
            return res.status(400).json({ message: "Bank account number already exist" });
        }

        // Check staffId already exists 
        const checkStaffId = await prisma.financialDetails.findFirst({
            where: {
                staffId: validationData.staffId
            }
        });
        if (checkStaffId) {
            return res.status(400).json({ message: "staffId already exist" });
        }

        const financialDetails = await prisma.financialDetails.create({
            data: {
                ...validationData,
                adminId: admin.id
            },
            include: {
                staffDetails: true
            }
        });
        res.status(200).json({ message: "Financial details created successfully", data: financialDetails });
    } catch (error) {
        next(error);
    }
}

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

export { createFinancialDetails, getAllFinancialDetails };