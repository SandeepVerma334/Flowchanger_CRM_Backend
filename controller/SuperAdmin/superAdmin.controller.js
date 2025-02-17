import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
const prisma = new PrismaClient();
import nodemailer from 'nodemailer';
import {superAdminDetailsSchema} from "../../utils/validation.js";

// Create Super Admin API endpoint with validation
const createSuperAdmin = async (req, res, next) => {
    try {
        // Validate the request body using Zod schema
        const { email, password } = req.body;

        const parsed = superAdminDetailsSchema.safeParse({ email, password });

        if (!parsed.success) {
            // If validation fails, return 400 with error details
            return res.status(400).json({
                message: 'Validation failed',
                errors: parsed.error.errors,
            });
        }

        // Check if the super admin already exists
        const existingUser = await prisma.superAdminDetails.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create the super admin user in the database
        const superAdmin = await prisma.superAdminDetails.create({
            data: {
                email,
                password: hashedPassword,
                role: 'SUPERADMIN',
            },
        });

        // Return success response
        res.status(201).json({
            message: 'Super Admin created successfully',
            user: {
                id: superAdmin.id,
                email: superAdmin.email,
                role: superAdmin.role,
            },
        });
    } catch (error) {
        next(error); // Pass error to the next error-handling middleware
    }
};

// Super Admin Login Function with bcrypt
const superAdminLogin = async (req, res, next) => {

    const { email, password } = req.body;

    try {
        const superAdminDetails = await prisma.superAdminDetails.findUnique({
            where: { email: email },
        });

        if (!superAdminDetails) {
            return res.status(404).json({ message: "Super Admin not found!" });
        }

        const storedHashedPassword = superAdminDetails.password;
        const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: superAdminDetails.id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            message: "Login successful",
            superAdminDetails: {
                id: superAdminDetails.id,
                email: superAdminDetails.email,
                role: superAdminDetails.role,
                token: token
            },
        });
    } catch (error) {
        next(error)
        // console.error("Error logging in super admin:", error);
        // return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

export { superAdminLogin, createSuperAdmin };
