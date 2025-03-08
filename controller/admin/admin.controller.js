import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../prisma/prisma.js";
import { adminSignupSchema } from "../../utils/validation.js";
import { sendOtpEmail } from '../../utils/emailService.js';

const adminSignup = async (req, res, next) => {
    try {
        // Validate the request body using Zod schema
        const validatedData = adminSignupSchema.parse(req.body);

        const user = await prisma.user.findUnique({
            where: {
                email: validatedData.email
            }
        });

        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

        // Create the admin user in the database
        const newUser = await prisma.user.create({
            data: { ...validatedData, role: "ADMIN", password: hashedPassword },
        });

        // Return response
        res.status(201).json({
            message: "User created successfully",
        });

    } catch (error) {
        next(error);
    }
}

const updateAdminProfile = async (req, res, next) => {
    try {
        const {
            email,
            mobile,
            company_name,
            time_zone,
            address,
            city,
            state,
            zipCode,
            country,
            gender,
            designation,
            businessType,
            services,
            companySize,
            role,
            packageId
        } = req.body;

        // Find the user by email
        const user = await prisma.user.findUnique({
            where: { email: email }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Upsert AdminDetails (create if missing, update if exists)
        const updatedAdminDetails = await prisma.adminDetails.upsert({
            where: { userId: user.id },  // unique userId in AdminDetails
            update: {
                company_name,
                time_zone,
                address,
                city,
                state,
                zipCode,
                country,
                gender,
                designation,
                businessType,
                services,
                companySize,
                role,
                packageId
            },
            create: {
                userId: user.id,
                company_name,
                time_zone,
                address,
                city,
                state,
                zipCode,
                country,
                gender,
                designation,
                businessType,
                services,
                companySize,
                role,
                packageId
            }
        });

        res.status(200).json({
            message: "Admin profile updated successfully",
            // user: updatedUser,
            adminDetails: updatedAdminDetails
        });

    } catch (error) {
        next(error);
    }
};


const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email: email }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Access denied. User is not an admin." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);  // Compare hashed password

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Generate JWT token with user ID    

        res.status(200).json({
            message: "Login successfuly",
            token,
            data: user  // Send token in response
        });

    } catch (error) {
        next(error);
    }
}

const verifyOTP = async (req, res, next) => {
    try {
        const { otp, email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check OTP and Expiry
        const now = new Date();

        console.log(user.otp, otp)

        if (user.otp === parseInt(otp) && user.otpExpiresAt > now) {
            await prisma.user.update({
                where: { email },
                data: {
                    is_verified: true,
                    otp: null,               // Clear OTP after verification
                    otpExpiresAt: null       // Clear expiry after verification
                },
            });

            return res.status(200).json({ message: "OTP verified successfully." });
        } else {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

    } catch (error) {
        next(error);
    }
};
const sendOTP = async (req, res, next) => {
    try {
        const { email } = req.body;
        const data = await sendOtpEmail(email);
        res.status(200).json({ message: "OTP sent successfully." });
    } catch (error) {
        next(error);
    }
};

const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10 } = req.query;
        const users = await prisma.user.findMany({
            where: {
                role: "ADMIN"
            },
            include: {
                adminDetails: {
                    include: {
                        package: true
                    }
                },
            },
            skip: (page - 1) * pageSize,
            take: parseInt(pageSize),
        });

        const totalUsers = await prisma.user.count({
            where: {
                role: "ADMIN"
            }
        });

        res.status(200).json({
            users,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalUsers,
                totalPages: Math.ceil(totalUsers / pageSize),
            }
        });
    } catch (error) {
        next(error);
    }
};

// get user by id
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: {
                id: id
            },
            include: {
                adminDetails: true
            }
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User found successfully", data: user });
    } catch (error) {
        next(error);
    }
};

// delete user by id
const deleteUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const existUserId = await prisma.user.findUnique({
            where: {
                id: id
            }
        })
        if (!existUserId) {
            return res.status(404).json({ message: "User not found" });
        }
        const user = await prisma.user.delete({
            where: {
                id: id
            }
        });
        res.status(200).json({ message: "User deleted successfully", data: user });
    } catch (error) {
        next(error);
    }
};

// Search users by name

const searchUsers = async (req, res, next) => {
    try {
        const { name } = req.query;
        const users = await prisma.user.findMany({
            where: {
                name: {
                    contains: name,
                    mode: "insensitive"
                }
            }
        });
        res.status(200).json({ message: "User search successful by name : " + name, data: users });
    } catch (error) {
        next(error);
    }
};


export { adminSignup, updateAdminProfile, adminLogin, getAllUsers, searchUsers, getUserById, deleteUserById, verifyOTP, sendOTP };
