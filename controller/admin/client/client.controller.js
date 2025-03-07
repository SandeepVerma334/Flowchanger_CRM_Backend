import prisma from "../../../prisma/prisma.js";
import { clientSchema } from "../../../utils/validation.js";
import checkAdmin from "../../../utils/adminChecks.js";
import bcrypt from 'bcrypt';
import { pagination } from "../../../utils/pagination.js";
import { sendEmailWithPdf, sendLoginCredentialsEmail } from "../../../utils/emailService.js";

const createClient = async (req, res, next) => {
    try {
        console.log(req.userId);
        const admin = await checkAdmin(req.userId);
        const validatedData = clientSchema.parse(req.body);
        const { email, password, name, phoneNumber, ...restValidation } = validatedData;
        const user = await prisma.user.findUnique({
            where: {
                email: email,
                role: "CLIENT"
            }
        })

        if (user) {
            return res.status(400).json({ message: "Client with this email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                role: "CLIENT",
                firstName: name,
                mobile: phoneNumber,
                adminId: admin.id,
                clientDetails: {
                    create: {
                        adminId: admin.adminDetails.id,
                        ...restValidation
                    }
                }
            },
            include: {
                clientDetails: true
            }
        })
        await sendEmailWithPdf(email, validatedData.name, password, validatedData.panNumber, `${process.env.CLIENT_URL}/login`);
        res.status(201).json({
            message: "Client created successfully",
            data: client
        });

    } catch (error) {
        next(error);
    }
}

const getClients = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);

        const { page, limit } = req.query;

        const where = {
            role: "CLIENT",
            adminId: admin.id
        };

        const include = {
            clientDetails: true
        };

        const result = await pagination(prisma.user, { page, limit, where, include });

        if (result.data.length === 0) {
            return res.status(404).json({ message: "No clients found.", data: [] });
        }

        res.status(200).json({
            message: "Clients found successfully", ...result
        });
    } catch (error) {
        next(error);
    }
};

const updateClient = async (req, res, next) => {
    try {
        const id = req.params.id;
        const admin = await checkAdmin(req.userId);
        const validatedData = clientSchema.optional().parse(req.body);
        const { email, password, name, phoneNumber, ...restValidation } = validatedData;

        const client = await prisma.user.findUnique({ where: { id } });
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        const updateclient = await prisma.user.update({
            where: { id },
            data: {
                email: email,
                password: password,
                firstName: name,
                mobile: phoneNumber,
            }
        });
        const clientDetails = await prisma.clientDetails.update({
            where: { userId: id },
            data: {
                ...restValidation,
            }
        });

        res.status(200).json({ message: "Client updated successfully" });
    } catch (error) {
        next(error);
    }
}

const getClientById = async (req, res, next) => {
    try {
        const id = req.params.id;
        const admin = await checkAdmin(req.userId);
        const client = await prisma.user.findUnique({
            where: { id },
            include: {
                clientDetails: true
            },
        });
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }
        res.status(200).json({ message: "Client found successfully", data: client });
    } catch (error) {
        next(error);
    }
}

const searchClientByName = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);

        const { page, limit, name } = req.query;

        if (!name) {
            return res.status(400).json({ message: "Name query parameter is required" });
        }

        const where = {
            role: "CLIENT",
            firstName: {
                contains: name,
                mode: "insensitive" // Case-insensitive search
            }
        };

        const include = {
            clientDetails: true
        };

        const result = await pagination(prisma.user, { page, limit, where, include });

        if (result.data.length === 0) {
            return res.status(404).json({ message: "No clients found with this name.", data: [] });
        }

        res.status(200).json({
            message: `Clients found successfully matching name: ${name}`,
            ...result
        });

    } catch (error) {
        next(error);
    }
};


export { createClient, getClients, updateClient, getClientById, searchClientByName };
