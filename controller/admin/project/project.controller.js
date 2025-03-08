import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../prisma/prisma.js";
import { adminSignupSchema } from "../../utils/validation.js";
import { sendOtpEmail } from '../../utils/emailService.js';

// create project

const createProject = async (req, res, next) => {
    try {
        const validatedData = adminSignupSchema.parse(req.body);
        const user = await prisma.user.findUnique({
            where: {
                email: validatedData.email
            }
        });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
        const newUser = await prisma.user.create({
            data: { ...validatedData, role: "ADMIN", password: hashedPassword },
        });
        res.status(201).json({
            message: "User created successfully",
        });
    } catch (error) {
        next(error);
    }
};