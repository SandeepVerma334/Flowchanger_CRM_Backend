import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../prisma/prisma.js";
import { superAdminDetailsSchema } from "../../utils/validation.js";
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
    }
};

// send email to admin for invite sign up
const sendInviteToAdmin = async (req, res) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
        const { email } = req.body;

        // Validate email input
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Welcome to Flow Changer Agency',
            text: 'Hello, you have been invited to join Flow Changer Agency. Please sign up using the provided link.\n\nhttps://docs.google.com/forms/d/e/1FAIpQLSfdvX-bMY_ZzIdtviTqIIKvDraQI9uloVSYnJHcpQyrSYjLXQ/viewform?pli=1&pli=1',            
        };

        const info = await transporter.sendMail(mailOptions);
        res.status(200).json({ 
            message: 'Email sent successfully',
            response: {
                subject: mailOptions.subject,
                text: mailOptions.text,
                link: mailOptions.link,
            }
        });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
};

export { superAdminLogin, createSuperAdmin, sendInviteToAdmin };
