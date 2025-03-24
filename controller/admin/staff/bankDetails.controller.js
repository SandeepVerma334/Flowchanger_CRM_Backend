
// import { bankDetailsSchema } from "../../../utils/validation.js";
import { bankDetailsSchema } from "../../../utils/validation.js"
import checkAdmin from "../../../utils/adminChecks.js";
import prisma from "../../../prisma/prisma.js";
import { pagination } from "../../../utils/pagination.js";

// add half day attendance according to the attendance start and end time
const addBankDetails = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const validation = bankDetailsSchema.parse(req.body);

        const existingBankDetails = await prisma.bankDetails.findFirst({
            where: {
                adminId: req.userId,
                staffId: validation.staffId
            }
        });

        if (existingBankDetails) {
            return res.status(400).json({ message: "Bank details already exist for this staff" });
        }

        const existingStaff = await prisma.staffDetails.findFirst({
            where: {
                id: validation.staffId,
                adminId: admin.user.adminDetails.id,
            }
        });

        if (!existingStaff) {
            return res.status(400).json({ message: "Invalid staffId or staff does not belong to this admin" });
        }

        const existingBank = await prisma.bankDetails.findFirst({
            where: {
                staffId: validation.staffId,
            }
        });

        if (existingBank && existingBank.staffId === validation.staffId) {
            const updateBankDetails = await prisma.bankDetails.update({
                where: {
                    id: existingBank.id,
                },
                data: {
                    ...validation,
                    adminId: admin.user.adminDetails.id,
                },
            });
            return res.status(200).json({
                message: "Bank details updated successfully",
                data: updateBankDetails
            });
        } else {
            const bankDetails = await prisma.bankDetails.create({
                data: {
                    ...validation,
                    adminId: admin.user.adminDetails.id,
                }
            });
            return res.status(201).json({
                message: "Bank details added successfully",
                data: bankDetails
            });
        }

    } catch (error) {
        next(error);
    }
};


// get all bank details
const getBankDetails = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }

        // check existing entry in bank details match staff id
        const existingBank = await prisma.bankDetails.findFirst({
            where: {
                id,
                adminId: admin.user.adminDetails.id
            }
        });
        if (!existingBank) {
            return res.status(400).json({ message: "Bank details not found" });
        }
        // check existing staff id match admin id
        const existingStaff = await prisma.staffDetails.findFirst({
            where: {
                id: existingBank.staffId,
                adminId: admin.user.adminDetails.id
            }
        });
        if (!existingStaff) {
            return res.status(400).json({ message: "Invalid staffId or staff does not belong to this admin" });
        }
        const bankDetails = await prisma.bankDetails.findMany({
            where: {
                adminId: admin.user.adminDetails.id
            },
            include: {
                staffDetails: {
                    include: {
                        User: true
                    },
                },
            },
        });
        res.status(200).json({ message: "Bank details fetched successfully", data: bankDetails });
    } catch (error) {
        next(error);
    }
}

// delete bank details by id

const deleteBankDetailsById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { id } = req.params;

        // check existing entry in bank details match staff id
        const existingBank = await prisma.bankDetails.findFirst({
            where: {
                id,
                adminId: req.userId
            }
        });
        if (!existingBank) {
            return res.status(400).json({ message: "Bank details not found" });
        }
        // check existing staff id match admin id
        const existingStaff = await prisma.staffDetails.findFirst({
            where: {
                id: existingBank.staffId,
                adminId: admin.user.adminDetails.id
            }
        });
        if (!existingStaff) {
            return res.status(400).json({ message: "Invalid staffId or staff does not belong to this admin" });
        }
        const bankDetails = await prisma.bankDetails.delete({
            where: {
                id,
                adminId: admin.user.adminDetails.id
            },
        });
        res.status(200).json({ message: "Bank details deleted successfully", data: bankDetails });
    } catch (error) {
        next(error);
    }
}

// get bank details by id

const getBankDetailsById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { staffId } = req.params;
        const existingBank = await prisma.bankDetails.findFirst({
            where: {
                staffId: staffId,
                adminId: admin.user.adminDetails.id
            }
        });
        if (!existingBank) {
            return res.status(404).json({ message: "Bank details not found for this staff" });
        }
        const existingStaff = await prisma.staffDetails.findFirst({
            where: {
                id: staffId,
                adminId: admin.user.adminDetails.id
            }
        });

        if (!existingStaff) {
            return res.status(400).json({ message: "Invalid staffId or staff does not belong to this admin" });
        }
        res.status(200).json({ message: "Bank details fetched successfully", data: existingBank });
    } catch (error) {
        next(error);
    }
};


// update bank details by id

const updateBankDetailsById = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { id } = req.params;

        const validation = bankDetailsSchema.parse(req.body);

        // check existing entry in bank details match staff id
        const existingBank = await prisma.bankDetails.findFirst({
            where: {
                id,
                adminId: admin.user.adminDetails.id
            }
        });
        if (!existingBank) {
            return res.status(400).json({ message: "Bank details not found" });
        }
        // check existing staff id match admin id
        const existingStaff = await prisma.staffDetails.findFirst({
            where: {
                id: existingBank.staffId,
                adminId: admin.user.adminDetails.id
            }
        });
        if (!existingStaff) {
            return res.status(400).json({ message: "Invalid staffId or staff does not belong to this admin" });
        }
        const bankDetails = await prisma.bankDetails.update({
            where: {
                id,
                adminId: admin.user.adminDetails.id
            },
            data: validation,
        });
        res.status(200).json({ message: "Bank details updated successfully", data: bankDetails });
    } catch (error) {
        next(error);
    }
}

// search bank details by bank name or account number or ifsc code or country or branch or account holder name or account status or staff id
const searchBankDetails = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const { search, bankName, accountNumber, ifsc, country, branch, accountHolderName, accountStatus, staffId, page, limit } = req.query;
        const adminId = admin.user.adminDetails.id;

        let orConditions = [];

        if (search) {
            orConditions.push(
                { bankName: { contains: search, mode: "insensitive" } },
                { accountNumber: { contains: search, mode: "insensitive" } },
                { ifsc: { contains: search, mode: "insensitive" } },
                { country: { contains: search, mode: "insensitive" } },
                { branch: { contains: search, mode: "insensitive" } },
                { accountHolderName: { contains: search, mode: "insensitive" } },
                { accountStatus: { contains: search, mode: "insensitive" } },
                { staffId: { contains: search, mode: "insensitive" } }
            );
        }

        if (bankName) orConditions.push({ bankName: { contains: bankName, mode: "insensitive" } });
        if (accountNumber) orConditions.push({ accountNumber: { contains: accountNumber, mode: "insensitive" } });
        if (ifsc) orConditions.push({ ifsc: { contains: ifsc, mode: "insensitive" } });
        if (country) orConditions.push({ country: { contains: country, mode: "insensitive" } });
        if (branch) orConditions.push({ branch: { contains: branch, mode: "insensitive" } });
        if (accountHolderName) orConditions.push({ accountHolderName: { contains: accountHolderName, mode: "insensitive" } });
        if (accountStatus) orConditions.push({ accountStatus: { contains: accountStatus, mode: "insensitive" } });
        if (staffId) orConditions.push({ staffId: { contains: staffId, mode: "insensitive" } });

        const whereCondition = {
            adminId: adminId,
            ...(orConditions.length > 0 ? { OR: orConditions } : {}),
        };

        const bankDetails = await pagination(prisma.bankDetails,{
             page, limit,
            where: whereCondition
             }
            );

        res.status(200).json({
            message: "Bank details fetched successfully",
            data: bankDetails,
        });
    } catch (error) {
        next(error);
    }
};

// get all bank details
const getAllBankDetails = async (req, res, next) => {
    try {
        const { page, limit } = req.params;
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const bankDetails = await pagination(prisma.bankDetails, {
            page, limit,
            where: {
                adminId: admin.user.adminDetails.id
            },
            include: {
                staffDetails: {
                    include: {
                        User: true
                    },
                },
            },
        });
        res.status(200).json({ message: "Bank details fetched successfully", data: bankDetails });
    } catch (error) {
        next(error);
    }
}


export { addBankDetails, getBankDetails, deleteBankDetailsById, getBankDetailsById, updateBankDetailsById, searchBankDetails, getAllBankDetails };