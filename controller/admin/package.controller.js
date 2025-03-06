import { z } from "zod";
import prisma from "../../prisma/prisma.js";
import { packageSchema } from "../../utils/validation.js";

export const createPackage = async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = packageSchema.parse(req.body);

        // Check if admin exists
        const adminExists = await prisma.adminDetails.findUnique({
            where: { userId: validatedData.adminId },
        });
        if (!adminExists) {
            return res.status(404).json({ error: "Admin not found" });
        }

        // Create or connect modules dynamically
        const modules = await Promise.all(
            validatedData.modules.map(async (moduleName) => {
                return await prisma.module.upsert({
                    where: { name: moduleName },
                    update: {}, // If module exists, do nothing
                    create: { name: moduleName }, // If module doesn't exist, create it
                });
            })
        );

        // Create package
        const newPackage = await prisma.package.create({
            data: {
                packageName: validatedData.packageName,
                packageNumber: validatedData.packageNumber,
                numberOfProjects: validatedData.numberOfProjects,
                price: validatedData.price,
                storageLimit: validatedData.storageLimit,
                unit: validatedData.unit,
                numberOfClients: validatedData.numberOfClients,
                validityTerms: validatedData.validityTerms,
                description: validatedData.description,
                adminId: validatedData.adminId,
                modules: {
                    connect: modules.map((module) => ({ id: module.id })),
                },
            },
            include: {
                modules: true,
                adminDetails: true,
                Subscription: true,
            },
        });

        return res.status(201).json(newPackage);
    } catch (error) {
        next(error);
        // console.error("Error creating package:", error);
        // return res.status(500).json({ error: "Internal server error" });
    }
};

export const getAllPackages = async (req, res, next) => {
    try {
        const packages = await prisma.package.findMany({
            include: {
                modules: true,
                adminDetails: true,
                Subscription: true,
            },
        });
        return res.status(200).json(packages);
    } catch (error) {
        next(error);
    }
};

export const updatePackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const validatedData = packageSchema.parse(req.body);

        // Check if package exists
        const existingPackage = await prisma.package.findUnique({ where: { id } });
        if (!existingPackage) {
            return res.status(404).json({ error: "Package not found" });
        }

        // Create or connect modules dynamically
        const modules = await Promise.all(
            validatedData.modules.map(async (moduleName) => {
                return await prisma.module.upsert({
                    where: { name: moduleName },
                    update: {},
                    create: { name: moduleName },
                });
            })
        );

        // Update package
        const updatedPackage = await prisma.package.update({
            where: { id },
            data: {
                packageName: validatedData.packageName,
                packageNumber: validatedData.packageNumber,
                numberOfProjects: validatedData.numberOfProjects,
                price: validatedData.price,
                storageLimit: validatedData.storageLimit,
                unit: validatedData.unit,
                numberOfClients: validatedData.numberOfClients,
                validityTerms: validatedData.validityTerms,
                description: validatedData.description,
                adminId: validatedData.adminId,
                modules: {
                    set: [], // Clear existing modules
                    connect: modules.map((module) => ({ id: module.id })),
                },
            },
            include: {
                modules: true,
                adminDetails: true,
            },
        });

        return res.status(200).json(updatedPackage);
    } catch (error) {
        next(error)
    }
};


export const getAllModules = async (req, res) => {
    try {
        const modules = await prisma.module.findMany({
            include: {
                packages: true,
            },
        });
        return res.status(200).json(modules);
    } catch (error) {
        console.error("Error fetching modules:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

//get package by admin id

export const getPackageByAdminId = async (req, res) => {
    try {
        const { adminId } = req.params; // get admin id from request params
        const packages = await prisma.package.findMany({
            where: {
                adminId: adminId,
            },
            include: {
                modules: true,
                adminDetails: true,
            },
        });
        return res.status(200).json(packages);
    } catch (error) {
        console.error("Error fetching packages:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// get package by id
export const getPackageById = async (req, res) => {
    try {
        const { id } = req.params;
        const pkg = await prisma.package.findUnique({
            where: {
                id: id,
            },
            include: {
                modules: true,
                adminDetails: true,
            },
        });
        return res.status(200).json(pkg);
    } catch (error) {
        console.error("Error fetching package:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};