import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../../prisma/prisma.js";
import { adminSignupSchema } from "../../utils/validation.js";

const adminSignup = async (req, res, next) => {
    try {
        // Validate the request body using Zod schema
        const safeParsed = adminSignupSchema.safeParse(req.body);

        if (!safeParsed.success) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: safeParsed.error.errors,
            });
        }

        // Extract validated data
        const { name, email, dateOfBirth, dateOfJoining, gender, mobile, designation, address, city, state, zipCode, country, password } = safeParsed.data;

        // Check if the admin already exists
        const existingUser = await prisma.user.findUnique({
            where: { role: "ADMIN", email },
        });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create the admin user in the database
        const admin = await prisma.user.create({
            data: {
                name,
                email,
                dateOfBirth,
                dateOfJoining,
                gender,
                mobile,
                password: hashedPassword,
                role: "ADMIN",
                adminDetails: {
                    create: {
                        designation,
                        address,
                        city,
                        state,
                        zipCode,
                        country,

                    }
                }
            },
        });

        // Return response
        res.status(201).json({
            message: "User created successfully",
            user: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
            },
        });

    } catch (error) {
        next(error);
    }
};

// get all users by role
const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, pageSize = 10 } = req.query; 
        const users = await prisma.user.findMany({ 
            where: {
                role: "ADMIN"
            },
            include: {
                adminDetails: true
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
        if(!user){
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
        if(!existUserId){
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
        res.status(200).json({message:"User search successful by name : " + name , data: users});
    } catch (error) {
        next(error);
    }
};

export { adminSignup, getAllUsers, searchUsers, getUserById, deleteUserById };
