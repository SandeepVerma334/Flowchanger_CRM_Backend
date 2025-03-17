import { z } from "zod";
import prisma from "../../prisma/prisma.js";
import { packageSchema } from "../../utils/validation.js";
import { pagination } from "../../utils/pagination.js";
import { error } from "pdf-lib";

const createPackage = async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = packageSchema.parse(req.body);

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
                // adminId: validatedData.adminId,
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

const getAllPackages = async (req, res, next) => {
    try {
        const { page, limit } = req.query;

        const include = {
            modules: true,
            adminDetails: true,
            Subscription: true,
        };

        const allPackages = await pagination(prisma.package, { page, limit, include });

        return res.status(200).json({
            message: allPackages.data.length === 0 ? "No packages found" : "Packages found successfully",
            ...allPackages
        });

    } catch (error) {
        next(error);
    }
};

const updatePackageById = async (req, res, next) => {
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
                ...(validatedData.adminId && {
                    adminDetails: {
                        connect: {
                            id: validatedData.adminId
                        }
                    },
                }),
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

        return res.status(200).json({
            message: "Package updated successfully",
            data: updatedPackage
        });
    } catch (error) {
        next(error)
    }
};


const getAllModules = async (req, res, next) => {
    try {
        const { page, limit } = req.query
        const include = {
            packages: true
        }

        const allModules = await pagination(prisma.module, {
            include, page, limit
        })
        return res.status(200).json({
            message: "All modules fetched successfully",
            ...allModules
        });
    } catch (error) {
        next(error);
    }
};

//get package by admin id

const getPackageById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type } = req.query// get admin id from request params
        const packages = await prisma.package.findMany({
            where: {
                ...(type === "admin" && {
                    adminId: id,
                }),
                ...(type === "package" && {
                    id: id,
                })
            },
            include: {
                modules: true,
                adminDetails: true,
            },
        });
        return res.status(200).json({
            message: type === "admin" ? "Admin packages fetched successfully" : "Package details fetched successfully",
            data: type === "admin" ? packages : packages[0]
        });
    } catch (error) {
        next(error)
    }
};


const deletePackage = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log(id);
        const findPackage = await prisma.package.findUnique({
            where: {
                id
            }
        });

        if (!findPackage) {
            return res.status(404).json({ message: "Package not found" })
        }
        await prisma.package.delete({
            where: {
                id: id,
            },
        });

        return res.status(200).json({ message: "Package deleted successfully" });
    }
    catch (error) {
        next(error);
    }
}

const countPackage = async (req, res, next) => {
    try {
        const allPackageCount = await prisma.package.count();
        return res.json({ message: "Count Packages", count: allPackageCount });
    }
    catch (error) {
        next(error);
    }
}
export { createPackage, updatePackageById, getAllModules, getPackageById, getAllPackages, deletePackage, countPackage }
