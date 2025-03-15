import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../prisma/prisma.js";
import { superAdminDetailsSchema } from "../../utils/validation.js";
// import sendMail from "../../utils/sendMail.js";
import { sendPasswordResetAndForgotEmail, sendInviteToAdminMail } from '../../utils/emailService.js';

const createSuperAdmin = async (req, res, next) => {
    try {
        // Validate the request body using Zod schema
        const { email, password, name, mobile } = req.body;

        const parsed = superAdminDetailsSchema.safeParse({ email, password, name, mobile });

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
                name,
                mobile,
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

        return res.status(201).json({
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
    }
};

// send email to admin for invite sign up
const sendInviteToAdmin = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }



        const result = await sendInviteToAdminMail(email);

        if (result.success) {
            res.status(201).json({ message: "Email sent successfully", info: result.info });
        } else {
            res.status(500).json({ error: "Failed to send email", details: result.error });
        }
    } catch (error) {
        next(error)
        // console.error("Error in sendInviteToAdmin:", error);
        // res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
};

// super admin password fogot API

const superAdminPasswordResetLink = async (req, res, next) => {
    const { email, } = req.body;

    try {
        const superAdminDetails = await prisma.superAdminDetails.findUnique({
            where: { email },
        });

        if (!superAdminDetails) {
            return res.status(404).json({ message: "Super Admin not found!" });
        }

        // Generate Reset Token
        const token = jwt.sign(
            { id: superAdminDetails.id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Nodemailer Transporter


        // // Reset Password Link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        // Send Email
        await sendPasswordResetAndForgotEmail(email, superAdminDetails.name, token, "reset");


        res.status(201).json({
            message: "We have sent a reset link to your registered official email. You can reset your password from there. This link will expire in 15 minutes.",
        });

    } catch (error) {
        next(error);
    }
};

// update password after clik reset link
const superAdminResetPassword = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const superAdminDetails = await prisma.superAdminDetails.findUnique({
            where: { email },
        });

        if (!superAdminDetails) {
            return res.status(404).json({ message: "Super Admin not found!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.superAdminDetails.update({
            where: { email },
            data: {
                password: hashedPassword,
            },
        });

        await sendPasswordResetAndForgotEmail(email, superAdminDetails.name, "", "Login");

        res.status(201).json({ message: "Password reset successfully" });
    } catch (error) {
        next(error);
    }
}


export { superAdminLogin, createSuperAdmin, sendInviteToAdmin, superAdminPasswordResetLink, superAdminResetPassword };
