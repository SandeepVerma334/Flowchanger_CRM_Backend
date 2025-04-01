import prisma from "../../../prisma/prisma.js";
import { clientSchema } from "../../../utils/validation.js";
import checkAdmin from "../../../utils/adminChecks.js";
import bcrypt from 'bcrypt';
import { pagination } from "../../../utils/pagination.js";
import { sendEmailWithPdf } from "../../../utils/emailService.js";
import jwt from 'jsonwebtoken';

function generateRandomString() {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const createClient = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json(admin.message);
        }
        const validatedData = clientSchema.parse(req.body);
        const { email, password, name, phoneNumber, ...restValidation } = validatedData;
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                role: "CLIENT",
                adminId: req.userId
            }
        })

        if (user) {
            return res.status(400).json({ message: "Client with this email already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const uniqueClientId = generateRandomString();
        const client = await prisma.user.create({
            data: {
                email: email,
                password: hashedPassword,
                role: "CLIENT",
                firstName: name,
                mobile: phoneNumber,
                adminId: req.userId,
                ClientDetails: {
                    create: {
                        adminId: admin.user.adminDetails.id,
                        clientId: uniqueClientId,
                        ...restValidation
                    }
                }
            },
            include: {
                ClientDetails: true
            }
        })
        await sendEmailWithPdf(email, uniqueClientId, validatedData.name, password, validatedData.panNumber, `${process.env.CLIENT_URL}/login`);
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
        if (admin.error) {
            return res.status(401).json(admin.message);
        }
        const { page, limit } = req.query;

        const where = {
            role: "CLIENT",
            adminId: req.userId
        };

        const include = {
            ClientDetails: true
        };

        const result = await pagination(prisma.user, { page, limit, where, include });

        console.log(result);

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
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }
        const id = req.params.id;
        const validatedData = clientSchema.partial().parse(req.body);
        const { email, password, name, phoneNumber, ...restValidation } = validatedData;

        const client = await prisma.user.findUnique({ where: { id, adminId: req.userId } });
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
        if (admin.error) {
            return res.status(401).json(admin.message);
        }
        const client = await prisma.user.findUnique({
            where: { id, adminId: req.userId },
            include: {
                ClientDetails: true
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
        if (admin.error) {
            return res.status(401).json(admin.message);
        }
        const { page, limit, search } = req.query;

        if (!search) {
            return res.status(400).json({ message: "Name query parameter is required" });
        }

        const where = {
            role: "CLIENT",
            OR: [
                {
                    firstName: {
                        contains: search,
                        mode: "insensitive" // Case-insensitive search
                    }
                },
                {
                    email: {
                        contains: search,
                        mode: "insensitive" // Case-insensitive search
                    }
                },
                {
                    mobile: {
                        contains: search,
                        mode: "insensitive" // Case-insensitive search
                    },
                }

            ],
            adminId: req.userId
        };

        const include = {
            ClientDetails: true
        };

        const result = await pagination(prisma.user, { page, limit, where, include });

        if (result.data.length === 0) {
            return res.status(404).json({ message: "No clients found with this name.", data: [] });
        }

        res.status(200).json({
            message: `Clients found successfully matching search : ${search}`,
            ...result
        });

    } catch (error) {
        next(error);
    }
};

const deleteClient = async (req, res, next) => {
    try {
        const id = req.params.id;
        const admin = await checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json(admin.message);
        }
        const client = await prisma.user.findUnique({ where: { id } });
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }
        await prisma.user.delete({ where: { id } });
        res.status(200).json({ message: "Client deleted successfully" });
    } catch (error) {
        next(error);
    }
}

const bulkDeleteClient = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json(admin.message);
        }
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "Invalid or empty IDs list." });
        }

        ids.forEach(async (id) => {
            const client = await prisma.user.findUnique({ where: { id } });
            if (client) {
                await prisma.user.delete({ where: { id } });
            }
        });

        res.status(200).json({ message: "Clients deleted successfully" });
    } catch (error) {
        next(error);
    }
};

// login client 
const loginClient = async (req, res, next) => {
    try {
        const { clientId, password } = req.body;

        const client = await prisma.clientDetails.findFirst({
            where: {
                clientId: clientId
            },
            include: {
                user: true
            }
        });
        console.log("client Data ", client.user.password);
        if (!client) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatchPassword = await bcrypt.compare(password, client.user.password);
        console.log(isMatchPassword)
        if (!isMatchPassword) {
            return res.status(401).json({ message: "Invalid password" });
        }
        // if (client.password !== password) {
        //     return res.status(401).json({ message: "Invalid password" });
        // }

        const token = jwt.sign({ id: client.user.id, adminId: client.adminId }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Generate JWT token with user ID    

        res.status(200).json({
            message: "Login successfuly",
            token,
            data: client  // Send token in response
        });
    } catch (error) {
        next(error);
    }
}

// get all data for clients

const getAllSingleClientData = async (req, res, next) => {
    try {
        const checkClient = await checkAdmin(req.userId, "CLIENT")
        if (checkClient.error) {
            return res.status(401).json(checkClient.message);
        }
        console.log("checkClient", checkClient)
        const client = await prisma.clientDetails.findFirst({
            where: {
                id: checkClient.user.ClientDetails.id,
            },
            include: {
                user: {
                    include: {
                        Discussion: true,
                        Note:true,
                    },
                },
                Project: true,
                adminDetails: true
            }
        })
        return res.status(200).json({ message: "Data found successfully", data: client });
    } catch (error) {
        next(error);
    }
}

export { createClient, getClients, updateClient, getClientById, searchClientByName, deleteClient, bulkDeleteClient, loginClient, getAllSingleClientData };
