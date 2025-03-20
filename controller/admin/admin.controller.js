import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../prisma/prisma.js";
import { sendOtpEmail, sendPasswordResetAndForgotEmail } from '../../utils/emailService.js';
import { pagination } from '../../utils/pagination.js';
import { adminSignupSchema } from "../../utils/validation.js";
import checkAdmin from '../../utils/adminChecks.js';

const adminSignup = async (req, res, next) => {
    try {
        // Validate the request body using Zod schema
        const validatedData = adminSignupSchema.parse(req.body);

        const user = await prisma.user.findFirst({
            where: {
                email: validatedData.email
            },
            include: {
                adminDetails: true,
            }
        });

        console.log(user);

        if (user && user.adminDetails) {
            return res.status(400).json({ message: "User already exists" });
        }
        if (user && !user.adminDetails) {
            await prisma.user.delete({ where: { id: user.id } })
        }
        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);

        // Create the admin user in the database
        const newUser = await prisma.user.create({
            data: {
                ...validatedData,
                role: "ADMIN",
                password: hashedPassword
            },
        });

        // Return response
        res.status(201).json({
            message: "User created successfully",
            data: newUser
        });

    } catch (error) {
        next(error);
    }
}

const updateAdminProfile = async (req, res, next) => {
    try {
        // const admin = await checkAdmin(req, res, next);
        // console.log(admin);
        const {
            email,
            mobile,
            password,
            companyName,
            timeZone,
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


        const user = await prisma.user.findFirst({
            where: { email: email },
            include: {
                adminDetails: true
            }
        });


        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update User fields
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                mobile,
                password,
                adminDetails: {
                    upsert: {
                        where: { userId: user.id },  // Use the adminDetailId to check existence
                        update: {
                            companyName,
                            timeZone,
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
                            ...(packageId && {
                                package: {
                                    connect: {
                                        id: packageId
                                    }
                                }
                            })
                        },
                        create: {
                            companyName,
                            timeZone,
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
                            ...(packageId && {
                                package: {
                                    connect: {
                                        id: packageId
                                    }
                                }
                            })
                        }
                    }
                }
            },
            include: {
                adminDetails: true
            }
        });


        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Generate JWT token with user ID    
        res.status(200).json({
            message: "Admin profile updated successfully",
            data: updatedUser,
            token: token,
        });

    } catch (error) {
        next(error);
    }
};


const adminLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findFirst({
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

        const user = await prisma.user.findFirst({
            where: { email },
        });

        console.log(user);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Check OTP and Expiry
        const now = new Date();


        if (user.otp === parseInt(otp) && user.otpExpiresAt > now) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    isVerified: true,
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
        const { page, limit } = req.query;

        const where = {
            role: "ADMIN",
        };

        const include = {
            adminDetails: true
        };

        const result = await pagination(prisma.user, { page, limit, where, include });

        if (result.data.length === 0) {
            return res.status(404).json({ message: "No Admin found.", data: [] });
        }

        res.status(200).json({
            message: "Admin found successfully", ...result
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
        console.log(existUserId);
        const user = await prisma.user.delete({
            where: {
                id: existUserId.id
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
        const { name, page, limit } = req.query;
        const users = await pagination(prisma.user, {
            where: {
                OR: [
                    {
                        firstName: {
                            contains: name,
                            mode: "insensitive"
                        }
                    },
                    {
                        lastName: {
                            contains: name,
                            mode: "insensitive"
                        }
                    }
                ]
            },
            page,
            limit
        });
        res.status(200).json({ message: "User search successful by name : " + name, ...users });
    } catch (error) {
        next(error);
    }
};
const adminPasswordResetLink = async (req, res, next) => {
    const { email, } = req.body;

    try {

        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const adminDetails = await prisma.user.findFirst({
            where: { email },
        });

        if (!adminDetails) {
            return res.status(404).json({ message: "Admin not found!" });
        }


        const token = jwt.sign(
            { id: adminDetails.id },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Reset Password Link
        await sendPasswordResetAndForgotEmail(email, adminDetails.firstName, token, "reset");
        res.status(200).json({
            message: "We have sent a reset link to your registered official email. You can reset your password from there. This link will expire in 15 minutes.",
        });

    } catch (error) {
        next(error);
    }
};

// update password after clik reset link
const adminResetPassword = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        const adminDetails = await prisma.user.findFirst({
            where: { email },
        });

        if (!adminDetails) {
            return res.status(404).json({ message: "Admin not found!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
            },
        });

        await sendPasswordResetAndForgotEmail(email, adminDetails.firstName, "", "login");
        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        next(error);
    }
}

const countAdmin = async (req, res, next) => {
    try {
        const allAdminCount = await prisma.user.count({
            where: {
                role: 'ADMIN',
            },
        });
        return res.json({ message: "Count Admin", count: allAdminCount });
    }
    catch (error) {
        next(error);
    }
}

export { adminLogin, adminPasswordResetLink, adminResetPassword, adminSignup, deleteUserById, getAllUsers, getUserById, searchUsers, sendOTP, updateAdminProfile, verifyOTP, countAdmin }; 
