import prisma from "../../prisma/prisma.js";
import { idSchema, newRoleSchema, updateRoleSchema } from "../../utils/validation.js";

const fetchRole = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        // Convert query parameters to integers
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        // Calculate the number of records to skip
        const skip = (pageNum - 1) * limitNum;

        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        if (!admin) {
            return res.status(400).json({
                message: "Admin not found!",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({ message: "Only admin can get roles!" });
        }

        // Fetch total count of roles for pagination metadata
        const totalRoles = await prisma.role.count({
            where: { adminId: req.userId },
        });

        // Fetch roles with pagination
        const allRoles = await prisma.role.findMany({
            where: { adminId: req.userId },
            include: {
                permissions: {
                    include: {
                        clients_permissions: true,
                        projects_permissions: true,
                        report_permissions: true,
                        staff_role_permissions: true,
                        settings_permissions: true,
                        staff_permissions: true,
                        task_permissions: true,
                        sub_task_permissions: true,
                        chat_module_permissions: true,
                        ai_permissions: true,
                    },
                },
            },
            skip,
            take: limitNum,
        });

        res.status(200).json({
            success: true,
            message: "Fetched all roles successfully",
            data: allRoles,
            pagination: {
                totalRoles,
                currentPage: pageNum,
                totalPages: Math.ceil(totalRoles / limitNum),
                pageSize: limitNum,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch all roles",
        });
    }
};

// fetch role with specific id
const fetchRoleWithId = async (req, res) => {
    const { id } = req.params;

    try {
        // Validate the id parameter
        const validateId = idSchema.safeParse(id);

        if (!validateId.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID format provided in params",
            });
        }

        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        if (!admin) {
            return res.status(400).json({
                message: "Admin not found!",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({ message: "Only admin can fetch role!" });
        }

        // Find role by id
        const findRole = await prisma.role.findFirst({
            where: { id: id },
            include: {
                permissions: {
                    include: {
                        clients_permissions: true,
                        projects_permissions: true,
                        report_permissions: true,
                        staff_role_permissions: true,
                        settings_permissions: true,
                        staff_permissions: true,
                        task_permissions: true,
                        sub_task_permissions: true,
                        chat_module_permissions: true,
                        ai_permissions: true,
                    },
                },
            },
        });

        // If role is not found
        if (!findRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
            });
        }

        // Successfully fetched the role
        res.status(200).json({
            success: true,
            message: `Fetched role details for ID ${id} successfully`,
            data: findRole,
        });
    } catch (error) {
        // Handle any other errors
        res.status(500).json({
            success: false,
            error: "Failed to fetch role: " + error.message,
        });
    }
};

// add new Role
async function addRole(req, res) {
    const { roleName, permissions } = req.body;
    try {
        const validateNewRoleData = newRoleSchema.safeParse({
            roleName,
            permissions,
        });
        if (!validateNewRoleData.success) {
            return res.status(400).json({
                success: false,
                message: validateNewRoleData.error.issues[0].message,
            });
        }
        // console.log(permissions);
        // find Role with name if exist or not
        // const findRoleWithName = await prisma.role.findFirst({
        //   where: {
        //     role_name: roleName,
        //   },
        // });

        // // if find role with name then return false
        // if (findRoleWithName) {
        //   return res.json({
        //     status: false,
        //     message: "Role is already created with " + roleName + " name",
        //   });
        // }

        // if role is not exist then create new role
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        if (!admin) {
            return res.status(400).json({
                message: "Admin not found!",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({ message: "Only admin can create role!" });
        }
        const newRole = await prisma.role.create({
            data: {
                role_name: roleName, // Provide role name
                adminId: req.userId,
                permissions: {
                    create: {
                        clients_permissions: {
                            create: {
                                view_global:
                                    permissions.clients_permissions?.view_global ?? false,
                                create: permissions.clients_permissions?.create ?? false,
                                edit: permissions.clients_permissions?.edit ?? false,
                                delete: permissions.clients_permissions?.delete ?? false,
                            },
                        },
                        projects_permissions: {
                            create: {
                                view_global:
                                    permissions.projects_permissions?.view_global ?? false,
                                create: permissions.projects_permissions?.create ?? false,
                                edit: permissions.projects_permissions?.edit ?? false,
                                delete: permissions.projects_permissions?.delete ?? false,
                            },
                        },
                        report_permissions: {
                            create: {
                                view_global:
                                    permissions.report_permissions?.view_global ?? false,
                                view_time_sheets:
                                    permissions.report_permissions?.view_time_sheets ?? false,
                            },
                        },
                        staff_role_permissions: {
                            create: {
                                view_global:
                                    permissions.staff_role_permissions?.view_global ?? false,
                                create: permissions.staff_role_permissions?.create ?? false,
                                edit: permissions.staff_role_permissions?.edit ?? false,
                                delete: permissions.staff_role_permissions?.delete ?? false,
                            },
                        },
                        settings_permissions: {
                            create: {
                                view_global:
                                    permissions.settings_permissions?.view_global ?? false,
                                view_time_sheets:
                                    permissions.settings_permissions?.view_time_sheets ?? false,
                            },
                        },
                        staff_permissions: {
                            create: {
                                view_global:
                                    permissions.staff_permissions?.view_global ?? false,
                                create: permissions.staff_permissions?.create ?? false,
                                edit: permissions.staff_permissions?.edit ?? false,
                                delete: permissions.staff_permissions?.delete ?? false,
                            },
                        },
                        task_permissions: {
                            create: {
                                view_global: permissions.task_permissions?.view_global ?? false,
                                create: permissions.task_permissions?.create ?? false,
                                edit: permissions.task_permissions?.edit ?? false,
                                delete: permissions.task_permissions?.delete ?? false,
                            },
                        },
                        sub_task_permissions: {
                            create: {
                                view_global:
                                    permissions.sub_task_permissions?.view_global ?? false,
                                create: permissions.sub_task_permissions?.create ?? false,
                                edit: permissions.sub_task_permissions?.edit ?? false,
                                delete: permissions.sub_task_permissions?.delete ?? false,
                            },
                        },
                        chat_module_permissions: {
                            create: {
                                grant_access:
                                    permissions.chat_module_permissions?.grant_access ?? false,
                            },
                        },
                        ai_permissions: {
                            create: {
                                grant_access: permissions.ai_permissions?.grant_access ?? false,
                            },
                        },
                    },
                },
            },
            include: {
                permissions: {
                    include: {
                        clients_permissions: true,
                        projects_permissions: true,
                        report_permissions: true,
                        staff_role_permissions: true,
                        settings_permissions: true,
                        staff_permissions: true,
                        task_permissions: true,
                        sub_task_permissions: true,
                        chat_module_permissions: true,
                        ai_permissions: true,
                    },
                },
            },
        });

        res.status(200).json({
            success: true,
            message: "New role add successfully",
            data: newRole,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            error: "Failed to add role" + error.message,
        });
    }
}

// updated Role for specific id
const updateRole = async (req, res) => {
    const { id } = req.params;
    const admin = await prisma.user.findUnique({
        where: {
            id: req.userId,
        },
    });

    if (!admin) {
        return res.status(400).json({
            message: "Admin not found!",
        });
    }
    if (admin.role !== "ADMIN") {
        return res.status(400).json({ message: "Only admin can update role!" });
    }
    const { roleName, permissions } = req.body;

    try {
        if (!id) {
            return res.status(400).json({
                success: false,
                error: "Role ID is required",
            });
        }

        const validateUpdatedRoleData = updateRoleSchema.safeParse({
            roleName,
            permissions,
        });
        if (!validateUpdatedRoleData.success) {
            return res.status(400).json({
                success: false,
                message: validateNewRoleData.error.issues[0].message,
            });
        }

        const findRole = await prisma.role.findUnique({
            where: { id },
            include: {
                permissions: {
                    include: {
                        clients_permissions: true,
                        projects_permissions: true,
                        report_permissions: true,
                        staff_role_permissions: true,
                        settings_permissions: true,
                        staff_permissions: true,
                        task_permissions: true,
                        sub_task_permissions: true,
                        chat_module_permissions: true,
                        ai_permissions: true,
                    },
                },
            },
        });

        // If the role is not found, return 404
        if (!findRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
            });
        }

        // Update the role with the provided values or retain existing values if not provided
        const updatedRole = await prisma.role.update({
            where: { id },
            data: {
                role_name: roleName,
                permissions: {
                    update: {
                        clients_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    view_global:
                                        permissions?.client_permissions?.view_global ??
                                        findRole.permissions.clients_permissions.view_global,
                                    create:
                                        permissions?.client_permissions?.create ??
                                        findRole.permissions.clients_permissions.create,
                                    edit:
                                        permissions?.client_permissions?.edit ??
                                        findRole.permissions.clients_permissions.edit,
                                    delete:
                                        permissions?.client_permissions?.delete ??
                                        findRole.permissions.clients_permissions.delete,
                                },
                            },
                        },
                        projects_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    view_global:
                                        permissions?.projectsPermissions?.view_global ??
                                        findRole.permissions.projects_permissions.view_global,
                                    create:
                                        permissions?.projectsPermissions?.create ??
                                        findRole.permissions.projects_permissions.create,
                                    edit:
                                        permissions?.projectsPermissions?.edit ??
                                        findRole.permissions.projects_permissions.edit,
                                    delete:
                                        permissions?.projectsPermissions?.delete ??
                                        findRole.permissions.projects_permissions.delete,
                                },
                            },
                        },
                        report_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    view_global:
                                        permissions?.reportPermissions?.view_global ??
                                        findRole.permissions.report_permissions.view_global,
                                    view_time_sheets:
                                        permissions?.reportPermissions?.view_time_sheets ??
                                        findRole.permissions.report_permissions.view_time_sheets,
                                },
                            },
                        },
                        staff_role_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    view_global:
                                        permissions?.staffRolePermissions?.view_global ??
                                        findRole.permissions.staff_role_permissions.view_global,
                                    create:
                                        permissions?.staffRolePermissions?.create ??
                                        findRole.permissions.staff_role_permissions.create,
                                    edit:
                                        permissions?.staffRolePermissions?.edit ??
                                        findRole.permissions.staff_role_permissions.edit,
                                    delete:
                                        permissions?.staffRolePermissions?.delete ??
                                        findRole.permissions.staff_role_permissions.delete,
                                },
                            },
                        },
                        settings_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    view_global:
                                        permissions?.settingsPermissions?.view_global ??
                                        findRole.permissions.settings_permissions.view_global,
                                    view_time_sheets:
                                        permissions?.settingsPermissions?.view_time_sheets ??
                                        findRole.permissions.settings_permissions.view_time_sheets,
                                },
                            },
                        },
                        staff_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    view_global:
                                        permissions?.staffPermissions?.view_global ??
                                        findRole.permissions.staff_permissions.view_global,
                                    create:
                                        permissions?.staffPermissions?.create ??
                                        findRole.permissions.staff_permissions.create,
                                    edit:
                                        permissions?.staffPermissions?.edit ??
                                        findRole.permissions.staff_permissions.edit,
                                    delete:
                                        permissions?.staffPermissions?.delete ??
                                        findRole.permissions.staff_permissions.delete,
                                },
                            },
                        },
                        task_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    view_global:
                                        permissions?.taskPermissions?.view_global ??
                                        findRole.permissions.task_permissions.view_global,
                                    create:
                                        permissions?.taskPermissions?.create ??
                                        findRole.permissions.task_permissions.create,
                                    edit:
                                        permissions?.taskPermissions?.edit ??
                                        findRole.permissions.task_permissions.edit,
                                    delete:
                                        permissions?.taskPermissions?.delete ??
                                        findRole.permissions.task_permissions.delete,
                                },
                            },
                        },
                        sub_task_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    view_global:
                                        permissions?.subTaskPermissions?.view_global ??
                                        findRole.permissions.sub_task_permissions.view_global,
                                    create:
                                        permissions?.subTaskPermissions?.create ??
                                        findRole.permissions.sub_task_permissions.create,
                                    edit:
                                        permissions?.subTaskPermissions?.edit ??
                                        findRole.permissions.sub_task_permissions.edit,
                                    delete:
                                        permissions?.subTaskPermissions?.delete ??
                                        findRole.permissions.sub_task_permissions.delete,
                                },
                            },
                        },
                        chat_module_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    grant_access:
                                        permissions?.chatModulePermissions?.grant_access ??
                                        findRole.permissions.chat_module_permissions.grant_access,
                                },
                            },
                        },
                        ai_permissions: {
                            update: {
                                where: { permissionsId: findRole.permissions.id },
                                data: {
                                    grant_access:
                                        permissions?.aiPermissions?.grantAccess ??
                                        findRole.permissions.ai_permissions.grant_access,
                                },
                            },
                        },
                    },
                },
            },
            include: {
                permissions: {
                    include: {
                        clients_permissions: true,
                        projects_permissions: true,
                        report_permissions: true,
                        staff_role_permissions: true,
                        settings_permissions: true,
                        staff_permissions: true,
                        task_permissions: true,
                        sub_task_permissions: true,
                        chat_module_permissions: true,
                        ai_permissions: true,
                    },
                },
            },
        });

        // Send a success response with updated role data
        res.status(200).json({
            success: true,
            message: "Role updated successfully",
            data: updatedRole,
        });
    } catch (error) {
        // Handle any errors
        if (error.code === "P2002") {
            // Unique constraint violation
            res.status(409).json({
                success: false,
                error: roleName + " role already exists.",
            });
        } else {
            // Handle any other errors
            res.status(500).json({
                success: false,
                error: "Failed to update role: " + error.message,
            });
        }
    }
};

//detete role in bulk
const deleteRoleInBulk = async (req, res) => {
    try {
        const { ids } = req.body; // Get IDs from the request body
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        if (!admin) {
            return res.status(400).json({
                message: "Admin not found!",
            });
        }
        if (admin.role !== "ADMIN") {
            return res
                .status(400)
                .json({ message: "Only admin can delete role in bulk!" });
        }
        const deletedRoles = await prisma.role.deleteMany({
            where: {
                id: {
                    in: ids,
                },
                adminId: req.userId,
            },
        });

        if (deletedRoles.count === 0) {
            return res.status(404).json({ message: "No roles found to delete!" });
        }

        res.status(200).json({
            success: true,
            message: "Roles deleted successfully",
            data: deletedRoles,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to delete roles: " + error.message,
            details: error,
        });
    }
};

// delete specific roleId's role
const deleteRole = async (req, res) => {
    const { id } = req.params; // Accepting roleId from params

    try {
        // Validate the id
        if (!id) {
            return res.status(400).json({
                success: false,
                error: "Role ID is required",
            });
        }

        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        if (!admin) {
            return res.status(400).json({
                message: "Admin not found!",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({ message: "Only admin can delete role!" });
        }
        // Validate the id parameter
        const validateId = idSchema.safeParse(id);

        if (!validateId.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID format provided in params",
            });
        }

        // Find the role by its ID
        const findRole = await prisma.role.findUnique({
            where: { id },
        });

        // If role not found, return 404
        if (!findRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
            });
        }

        // Delete the role by its ID
        await prisma.role.delete({ where: { id, adminId: req.userId } });

        res.status(200).json({
            success: true,
            message: "Role deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: `Failed to delete role: ${error.message}`,
        });
    }
};

const searchRoleByName = async (req, res) => {
    try {
        const { role_name } = req.query;
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            },
        });

        if (!admin) {
            return res.status(400).json({
                message: "Admin not found!",
            });
        }
        if (admin.role !== "ADMIN") {
            return res
                .status(400)
                .json({ message: "Only admin can find role by name!" });
        }
        const roleData = await prisma.role.findMany({
            where: {
                adminId: req.userId,
                role_name: {
                    contains: role_name,
                    mode: "insensitive",
                },
            },
        });
        res.status(200).json(roleData);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: false,
            message: "Failed to search role name" + error.message,
        });
    }
};

export { fetchRole, fetchRoleWithId, addRole, updateRole, deleteRoleInBulk, deleteRole, searchRoleByName };