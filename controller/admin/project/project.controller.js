import prisma from "../../../prisma/prisma.js";
import { projectSchema } from "../../../utils/validation.js";
import { sendSelectedStaffCustomers } from '../../../utils/emailService.js';
import { pagination } from "../../../utils/pagination.js";
import checkAdmin from "../../../utils/adminChecks.js";

const createProject = async (req, res, next) => {
    try {
        // Extract members and permissions from the request body
        const {
            members,
            customer,
            permissions
        } = req.body;

        // Validate request body using zod
        const validatedData = projectSchema.parse(req.body);
        console.log(validatedData)

        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        })
        if (!admin) {
            return res.status(400).json({
                status: false,
                message: "Admin not found",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({
                status: false,
                message: "Unauthorized access",
            });
        }
        // Validate staff members
        const staffMembers = await prisma.staffDetails.findMany({
            where: { id: { in: members } },
        });

        if (staffMembers.length !== members.length) {
            return res.status(400).json({
                status: false,
                message: "Some Member IDs are invalid",
            });
        }

        // Validate Customers
        const customerClients = await prisma.clientDetails.findMany({
            where: { id: { in: customer } },
        });
        console.log("Customer Clients:", customerClients);
        if (customerClients.length !== customer.length) {
            return res.status(400).json({ status: false, message: "Some Customer IDs are invalid" });
        }

        const clientUsers = await prisma.user.findMany({
            where: {
                ClientDetails: {
                    id: { in: customer }
                },
                role: "CLIENT",
            },
            select: { email: true },
        });

        const users = await prisma.staffDetails.findMany({
            where: {
                id: { in: members },
            },
            select: {
                User: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    }
                }
            }
        });
        const clientEmails = clientUsers.map(user => user.email).filter(email => email);
        const emails = users.map(user => user.User?.email).filter(email => email);
        const allEmails = [...emails, ...clientEmails];

        // Destructure validated fields (excluding permissions)
        const {
            projectName, progressBar, estimatedHours, startDate, deadline,
            description, sendMail, contactNotifications, visibleTabs
        } = validatedData;

        const project = await prisma.project.create({
            data: {
                projectName,
                progressBar,
                estimatedHours,
                startDate,
                deadline,
                description,
                sendMail,
                contactNotifications,
                visibleTabs,
                members: { connect: members.map((id) => ({ id })) },
                customer: { connect: customer.map((id) => ({ id })) },

                // Add ProjectPermissions
                ProjectPermissions: {
                    create: permissions.map(permission => ({
                        allowCustomerToViewTasks: permission.allowCustomerToViewTasks,
                        allowCustomerToCreateTasks: permission.allowCustomerToCreateTasks,
                        allowCustomerToEditTasks: permission.allowCustomerToEditTasks,
                        allowCustomerToCommentOnProjectTasks: permission.allowCustomerToCommentOnProjectTasks,
                        allowCustomerToViewTaskComments: permission.allowCustomerToViewTaskComments,
                        allowCustomerToViewTaskAttachments: permission.allowCustomerToViewTaskAttachments,
                        allowCustomerToViewTaskChecklistItems: permission.allowCustomerToViewTaskChecklistItems,
                        allowCustomerToUploadAttachmentsOnTasks: permission.allowCustomerToUploadAttachmentsOnTasks,
                        allowCustomerToViewTaskTotalLoggedTime: permission.allowCustomerToViewTaskTotalLoggedTime,
                        allowCustomerToViewFinanceOverview: permission.allowCustomerToViewFinanceOverview,
                        allowCustomerToUploadFiles: permission.allowCustomerToUploadFiles,
                        allowCustomerToOpenDiscussions: permission.allowCustomerToOpenDiscussions,
                        allowCustomerToViewMilestones: permission.allowCustomerToViewMilestones,
                        allowCustomerToViewGantt: permission.allowCustomerToViewGantt,
                        allowCustomerToViewTimesheets: permission.allowCustomerToViewTimesheets,
                        allowCustomerToViewActivityLog: permission.allowCustomerToViewActivityLog,
                        allowCustomerToViewTeamMembers: permission.allowCustomerToViewTeamMembers
                    }))
                }
            },
            include: {
                members: true,
                ProjectPermissions: true,
            }
        });
        // send mail for selected members and customers
        if (allEmails.length > 0) {
            await sendSelectedStaffCustomers(allEmails);
        }
        // Return success response
        res.status(201).json({
            status: true,
            message: "Project created successfully! An email has been sent to you. Please check your inbox.",
            data: project,
        });

    } catch (error) {
        next(error);
    }
};

// get all project
const getAllProjects = async (req, res, next) => {
    const { id } = req.params;
    try {
        const { page, limit } = req.query;

        const admin = checkAdmin(req.userId, "ADMIN", res);

        // Define where filter based on your use case (filter projects by id, status, etc.)
        const where = {
            id: id, // Assuming you're filtering by project ID
        };

        const projects = await prisma.project.findMany({
            where,
            include: {
                ProjectPermissions: true,
                members: {
                    include: {
                        User: {
                            select: {
                                id: true,
                                mobile: true,
                                role: true,
                                isVerified: true,
                                packageId: true,
                                adminId: true,
                                otp: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        // Pagination logic using your custom pagination function
        const result = await pagination(prisma.project, {
            page, limit, where, include: {
                ProjectPermissions: true,
                members: {
                    include: {
                        User: {
                            select: {
                                id: true,
                                mobile: true,
                                role: true,
                                isVerified: true,
                                packageId: true,
                                adminId: true,
                                otp: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            }
        });

        // Return paginated result
        res.status(200).json({
            status: true,
            projects,
            pages: result, // Include pagination result
        });
    } catch (error) {
        next(error);
    }
};


// get single project  by id

const getProjectById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        })
        if (!admin) {
            return res.status(400).json({
                status: false,
                message: "Admin not found",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({
                status: false,
                message: "Unauthorized access",
            });
        }
        const projectData = await prisma.project.findUnique({
            where: {
                id: id
            },
            include: {
                ProjectPermissions: true,
                members: {
                    include: {
                        User: {
                            select: {
                                id: true,
                                mobile: true,
                                role: true,
                                isVerified: true,
                                packageId: true,
                                adminId: true,
                                otp: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json({
            status: true,
            message: "Project retrieved successfully",
            data: projectData,
        });

    } catch (error) {
        next(error);
    }
};

// delete project by id
const deleteProjectById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        })
        if (!admin) {
            return res.status(400).json({
                status: false,
                message: "Admin not found",
            });
        }
        if (admin.role !== "ADMIN") {
            return res.status(400).json({
                status: false,
                message: "Unauthorized access",
            });
        }
        const existProjectId = await prisma.project.findUnique({
            where: {
                id: id,
            },
        });
        if (!existProjectId) {
            return res.status(404).json({ message: "Project not found" });
        }
        const project = await prisma.project.delete({
            where: {
                id: id
            }
        });
        res.status(200).json({ message: "Project deleted successfully", data: project });
    } catch (error) {
        next(error);
    }
}

// search project by name

const searchProjectByName = async (req, res, next) => {
    try {
        
        const admin = checkAdmin(req.userId, "ADMIN", res);

        const { projectName } = req.query;
        const projects = await prisma.project.findMany({
            where: {
                projectName: {
                    contains: projectName,
                    mode: "insensitive"
                }
            },
            include: {
                ProjectPermissions: true,
                members: {
                    include: {
                        User: {
                            select: {
                                id: true,
                                mobile: true,
                                role: true,
                                isVerified: true,
                                packageId: true,
                                adminId: true,
                                otp: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
        res.status(200).json({ message: "Project search successful by name : " + projectName, data: projects });
    } catch (error) {
        next(error);
    }
}

// update project by id

const updateProjectById = async (req, res, next) => {
    const { id } = req.params;

    try {
        const { members, permissions } = req.body;

        // Log permissions to verify if they are received correctly
        console.log("Permissions received:", permissions);

        // Ensure permissions is an array
        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                status: false,
                message: "Permissions must be an array",
            });
        }

        if (permissions.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Permissions array cannot be empty",
            });
        }

        // Validate request body using zod
        const validatedData = projectSchema.parse(req.body);
        console.log(validatedData);

        // Check if the project exists
        const existingProject = await prisma.project.findUnique({ where: { id } });
        if (!existingProject) {
            return res.status(404).json({
                status: false,
                message: "Project not found",
            });
        }

        // Validate admin
        const admin = await prisma.user.findUnique({
            where: { id: req.userId },
        });

        if (!admin || admin.role !== "ADMIN") {
            return res.status(403).json({
                status: false,
                message: "Unauthorized access",
            });
        }

        // Validate staff members
        const staffMembers = await prisma.staffDetails.findMany({
            where: { id: { in: members } },
        });

        if (staffMembers.length !== members.length) {
            return res.status(400).json({
                status: false,
                message: "Some Member IDs are invalid",
            });
        }

        // Fetch emails from staff details and user table
        const users = await prisma.staffDetails.findMany({
            where: { id: { in: members } },
            select: {
                User: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    }
                }
            }
        });

        // Extract emails
        const emails = users.map(user => user.User?.email).filter(email => email);

        // Destructure validated fields
        const {
            projectName, progressBar, estimatedHours, startDate, deadline,
            description, sendMail, contactNotifications, visibleTabs
        } = validatedData;

        // Update project
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                projectName,
                progressBar,
                estimatedHours,
                startDate,
                deadline,
                description,
                sendMail,
                contactNotifications,
                visibleTabs,
                members: { set: members.map((id) => ({ id })) }, // Reset members before adding new ones

                // Update ProjectPermissions
                ProjectPermissions: {
                    deleteMany: {}, // Remove old permissions
                    create: permissions.map(permission => ({
                        allowCustomerToViewTasks: permission.allowCustomerToViewTasks,
                        allowCustomerToCreateTasks: permission.allowCustomerToCreateTasks,
                        allowCustomerToEditTasks: permission.allowCustomerToEditTasks,
                        allowCustomerToCommentOnProjectTasks: permission.allowCustomerToCommentOnProjectTasks,
                        allowCustomerToViewTaskComments: permission.allowCustomerToViewTaskComments,
                        allowCustomerToViewTaskAttachments: permission.allowCustomerToViewTaskAttachments,
                        allowCustomerToViewTaskChecklistItems: permission.allowCustomerToViewTaskChecklistItems,
                        allowCustomerToUploadAttachmentsOnTasks: permission.allowCustomerToUploadAttachmentsOnTasks,
                        allowCustomerToViewTaskTotalLoggedTime: permission.allowCustomerToViewTaskTotalLoggedTime,
                        allowCustomerToViewFinanceOverview: permission.allowCustomerToViewFinanceOverview,
                        allowCustomerToUploadFiles: permission.allowCustomerToUploadFiles,
                        allowCustomerToOpenDiscussions: permission.allowCustomerToOpenDiscussions,
                        allowCustomerToViewMilestones: permission.allowCustomerToViewMilestones,
                        allowCustomerToViewGantt: permission.allowCustomerToViewGantt,
                        allowCustomerToViewTimesheets: permission.allowCustomerToViewTimesheets,
                        allowCustomerToViewActivityLog: permission.allowCustomerToViewActivityLog,
                        allowCustomerToViewTeamMembers: permission.allowCustomerToViewTeamMembers
                    }))
                }
            },
            include: {
                members: true,
                ProjectPermissions: true,
            }
        });

        // Send email notification
        if (emails.length > 0) {
            await sendSelectedStaffCustomers(emails);
        }

        // Return success response
        res.status(200).json({
            status: true,
            message: "Project updated successfully! An email has been sent to the selected members.",
            data: updatedProject,
        });

    } catch (error) {
        next(error);
    }
};

// bulk delete project using id

const bulkDeleteProjectById = async (req, res, next) => {
    try {
        // Extract project IDs from request body
        const { projectId } = req.body;

        // Validate that ids is an array and not empty
        if (!Array.isArray(projectId) || projectId.length === 0) {
            return res.status(400).json({
                status: false,
                message: "  Please provide an array of project IDs to delete",
            });
        }

        // Delete projects based on the provided IDs
        const deletedProjects = await prisma.project.deleteMany({
            where: {
                id: { in: projectId },
            },
        });

        // If no projects were deleted
        if (deletedProjects.count === 0) {
            return res.status(404).json({
                status: false,
                message: "No projects found to delete",
            });
        }

        // Return success response with the number of deleted projects
        res.status(200).json({
            status: true,
            message: `${deletedProjects.count} project(s) deleted successfully.`,
        });

    } catch (error) {
        console.error("Error deleting projects:", error);
        next(error);
    }
};


export { createProject, getAllProjects, getProjectById, deleteProjectById, searchProjectByName, updateProjectById, bulkDeleteProjectById };
