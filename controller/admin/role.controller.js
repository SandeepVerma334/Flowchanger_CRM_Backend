import prisma from "../../prisma/prisma.js";
import checkAdmin from "../../utils/adminChecks.js";
import { pagination } from "../../utils/pagination.js";
import { idSchema, newRoleSchema, updateRoleSchema } from "../../utils/validation.js";

const fetchRole = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const admin = await checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json(admin.message);
        }

        // Convert query parameters to integers
        const where = { adminId: req.userId };
        const include = {
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
        }

        const allRole = await pagination(prisma.role, {
            where,
            include,
            page,
            limit
        })

        return res.status(200).json({
            message: "All role fetched successfully",
            ...allRole
        })
    } catch (error) {
        next(error)
    }
};

// fetch role with specific id
const fetchRoleWithId = async (req, res, next) => {
    const { id } = req.params;

    try {
        // Validate the id parameter
        const validateId = idSchema.parse(id);
        const admin = await checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json(admin.message);
        }

        // Find role by id
        const findRole = await prisma.role.findFirst({
            where: { id: validateId.id },
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
        next(error);
    }
};

// add new Role
async function addRole(req, res) {
    const { roleName, permissions } = req.body;
    try {
        const validateNewRoleData = newRoleSchema.parse({
            roleName,
            permissions,
        });

        const admin = await checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json(admin.message)
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
    try {
        const { id } = req.params;
        const { roleName, permissions } = req.body;

        const admin = await checkAdmin(req.userId)
        if (admin.error) {
            return res.status(401).json(admin.message);
        }

        if (!id) {
            return res.status(400).json({
                success: false,
                error: "Role ID is required",
            });
        }

        const validateUpdatedRoleData = updateRoleSchema.partial().parse({
            roleName,
            permissions,
        });


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

        if (!findRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
            });
        }

        await prisma.permissions.delete({
            where: {
                id: findRole.permissions.id
            }
        })
        const updatedRole = await prisma.role.update({
            where: { id },
            data: {
                role_name: roleName,
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
        const { ids } = req.body;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json(admin.message);
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
const deleteRole = async (req, res, next) => {
    try {
        const { id } = req.params;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json(admin.message);
        }
        if (!id) {
            return res.status(400).json({
                success: false,
                error: "Role ID is required",
            });
        }


        const validateId = idSchema.parse(id);

        const findRole = await prisma.role.findUnique({
            where: { id },
        });

        if (!findRole) {
            return res.status(404).json({
                success: false,
                message: "Role not found.",
            });
        }

        await prisma.role.delete({ where: { id, adminId: req.userId } });

        res.status(200).json({
            success: true,
            message: "Role deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

const searchRoleByName = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const admin = await checkAdmin(req.userId);

        if (admin.error) {
            return res.status(401).json(admin.message);
        }
        const { search } = req.query;


        const where = {
            adminId: req.userId,
            role_name: {
                contains: search,
                mode: "insensitive",
            },
        }
        const include = {
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
        }
        const allRole = await pagination(prisma.role, {
            where,
            include,
            page,
            limit,
        })
        res.status(200).json({
            message: "Search role for value " + search + " successfully",
            ...allRole
        });
    } catch (error) {
        next(error);
    }
};

const countRoles = async (req, res, next) => {
    try {
        const admin = checkAdmin(req.userId);
        if (admin.error) {
            return res.status(401).json({ message: admin.message });
        }
        const count = await prisma.role.count({
            where: { adminId: req.userId },
        });

        res.status(200).json({ message: "Role count fetched successfully", count });
    } catch (error) {
        next(error);
    }
};
export { fetchRole, fetchRoleWithId, addRole, updateRole, deleteRoleInBulk, deleteRole, searchRoleByName, countRoles };