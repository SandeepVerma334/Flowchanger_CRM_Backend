import prisma from "../../../prisma/prisma.js";
import { projectSchema } from "../../../utils/validation.js";
import { sendSelectedStaffCustomers } from '../../../utils/emailService.js';
import { pagination } from "../../../utils/pagination.js";
import checkAdmin from "../../../utils/adminChecks.js";
import { all } from "axios";

const createProject = async (req, res, next) => {
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const { members, customer, permissions = [] } = req.body; // Default permissions to empty array
        const validatedData = projectSchema.parse(req.body);


        // Validate staff members
        const staffMembers = await prisma.staffDetails.findMany({
            where: { id: { in: members }, adminId: admin.user.adminDetails.id },
        });
        if (staffMembers.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Staff Id are not valid for this admin id",
            });
        }
        // Validate customer members
        const customerMembers = await prisma.clientDetails.findMany({
            where: { id: { in: customer }, adminId: admin.user.adminDetails.id },
        });
        //     if(customerMembers.length === 0) {
        //         return res.status(400).json({    
        //             status: false,
        //             message: "Client Id are not valid for this admin id",
        //     })
        // }
        // Validate staff members emails
        const staffMembersEmails = await prisma.staffDetails.findMany({
            where: { id: { in: members }, adminId: admin.user.adminDetails.id },
            include: {
                User: {
                    select: { email: true } // Fetch emails of staff members
                }
            }
        });
        // clientDetailsEmail get 
        const clientDetailsEmail = await prisma.clientDetails.findMany({
            where: { id: { in: customer }, adminId: admin.user.adminDetails.id },
            include: {
                user: {
                    select: { email: true }
                }
            }
        });
        // console.log("clientDetailsEmail " , clientDetailsEmail);
        const invalidMembers = staffMembers.filter(staff => staff.adminId !== admin.user.adminDetails.id);
        if (invalidMembers.length > 0) {
            return res.status(400).json({
                status: false,
                message: "Some Member IDs are invalid",
                invalidMembers: invalidMembers.map(staff => staff.id),
            });
        }

        // Extract emails from staffMembersEmails
        const staffEmails = staffMembersEmails.map(staff => staff.User?.email).filter(email => email);
        const clientEmails = clientDetailsEmail.map(client => client.user?.email).filter(email => email);
        const allEmails = [...staffEmails, ...clientEmails];
        const uniqueEmails = [...new Set(allEmails)];

        let customerClients = [];
        let customerEmails = [];
        if (customer && Array.isArray(customer) && customer.length > 0) {
            customerClients = await prisma.clientDetails.findMany({
                where: { id: { in: customer }, adminId: req.userId },
            });
        }
        // Prepare project permissions
        const projectPermissions = Array.isArray(permissions) ? permissions.map(permission => ({
            allowCustomerToViewTasks: permission.allowCustomerToViewTasks ?? false,
            allowCustomerToCreateTasks: permission.allowCustomerToCreateTasks ?? false,
            allowCustomerToEditTasks: permission.allowCustomerToEditTasks ?? false,
            allowCustomerToCommentOnProjectTasks: permission.allowCustomerToCommentOnProjectTasks ?? false,
            allowCustomerToViewTaskComments: permission.allowCustomerToViewTaskComments ?? false,
            allowCustomerToViewTaskAttachments: permission.allowCustomerToViewTaskAttachments ?? false,
            allowCustomerToViewTaskChecklistItems: permission.allowCustomerToViewTaskChecklistItems ?? false,
            allowCustomerToUploadAttachmentsOnTasks: permission.allowCustomerToUploadAttachmentsOnTasks ?? false,
            allowCustomerToViewTaskTotalLoggedTime: permission.allowCustomerToViewTaskTotalLoggedTime ?? false,
            allowCustomerToViewFinanceOverview: permission.allowCustomerToViewFinanceOverview ?? false,
            allowCustomerToUploadFiles: permission.allowCustomerToUploadFiles ?? false,
            allowCustomerToOpenDiscussions: permission.allowCustomerToOpenDiscussions ?? false,
            allowCustomerToViewMilestones: permission.allowCustomerToViewMilestones ?? false,
            allowCustomerToViewGantt: permission.allowCustomerToViewGantt ?? false,
            allowCustomerToViewTimesheets: permission.allowCustomerToViewTimesheets ?? false,
            allowCustomerToViewActivityLog: permission.allowCustomerToViewActivityLog ?? false,
            allowCustomerToViewTeamMembers: permission.allowCustomerToViewTeamMembers ?? false,
        })) : [];

        // Create the project
        const project = await prisma.project.create({
            data: {
                adminId: req.userId,
                projectName: validatedData.projectName,
                progressBar: validatedData.progressBar,
                estimatedHours: validatedData.estimatedHours,
                startDate: validatedData.startDate,
                deadline: validatedData.deadline,
                description: validatedData.description,
                sendMail: validatedData.sendMail,
                contactNotifications: validatedData.contactNotifications,
                visibleTabs: validatedData.visibleTabs,
                members: { connect: members.map(id => ({ id })) },
                ...(customer && customer.length > 0 ? { customer: { connect: customer.map(id => ({ id })) } } : {}),
                // customer: { connect: customer.map(id => ({ id })) },
                ProjectPermissions: {
                    create: projectPermissions
                }
            },
            include: {
                members: true,
                ProjectPermissions: true,
                customer: true
            }
        });

        // Check sendMail flag from the project
        const checkSendMailIsTrue = await prisma.project.findFirst({
            where: { id: project.id },
            select: { sendMail: true }
        });

        // If sendMail is true, send the email to all combined email addresses
        if (checkSendMailIsTrue?.sendMail) {
            await sendSelectedStaffCustomers(uniqueEmails);
            console.log(`Sent email to: ${uniqueEmails}`);
        }

        res.status(201).json({
            status: true,
            message: "Project created successfully!",
            data: project,
        });

    } catch (error) {
        console.error("Error creating project:", error);
        next(error);
    }
};

// get all project
const getAllProjects = async (req, res, next) => {
    const { id } = req.params;
    try {

        const admin = checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({
                message: admin.message
            });
        }
        const { page, limit } = req.query;
        const where = {
            id: id,
        };

        const projects = await prisma.project.findMany({
            where: {
                adminId: req.userId
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
    const { id, page, limit } = req.params;
    try {
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }
        const projectData = await pagination(prisma.project, {
            page, limit,
            where: {
                id: id,
                adminId: req.userId
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
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }
        // const admin = await prisma.user.findUnique({
        //     where: {
        //         id: req.userId,
        //     }
        // })
        // if (!admin) {
        //     return res.status(400).json({
        //         status: false,
        //         message: "Admin not found",
        //     });
        // }
        // if (admin.role !== "ADMIN") {
        //     return res.status(400).json({
        //         status: false,
        //         message: "Unauthorized access",
        //     });
        // }
        const existProjectId = await prisma.project.findUnique({
            where: {
                id: id,
                adminId: req.userId
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

        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const { projectName } = req.query;
        const projects = await prisma.project.findMany({
            where: {
                adminId: req.userId,
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
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }

        const { members, permissions, customer } = req.body;

        // Log permissions to verify if they are received correctly
        console.log("Permissions received:", permissions);

        // Ensure permissions is an array
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Permissions must be a non-empty array",
            });
        }

        // Validate request body using Zod
        const validatedData = projectSchema.parse(req.body);
        console.log(validatedData);

        // Check if the project exists
        const existingProject = await prisma.project.findUnique({
            where: { id, adminId: req.userId }
        });
        if (!existingProject) {
            return res.status(404).json({
                status: false,
                message: "Project not found",
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

        // Fetch emails from staff members
        const users = await prisma.staffDetails.findMany({
            where: { id: { in: members } },
            select: {
                User: {
                    select: {
                        email: true
                    }
                }
            }
        });
        const staffEmails = users.map(user => user.User?.email).filter(email => email);
        // Fetch customer emails if provided
        let customerEmails = [];
        if (Array.isArray(customer) && customer.length > 0) {
            const customerClients = await prisma.clientDetails.findMany({
                where: { id: { in: customer }, adminId: req.userId },
                select: { email: true }
            });

            customerEmails = customerClients.map(client => client.email).filter(email => email);
        }

        // Combine staff and customer emails
        const allEmails = [...staffEmails, ...customerEmails];

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
                members: { set: members.map(id => ({ id })) }, // Reset members before adding new ones

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

        // Check sendMail flag from the updated project
        if (updatedProject.sendMail && allEmails.length > 0) {
            console.log("Sending emails to:", allEmails);

            try {
                await sendSelectedStaffCustomers(allEmails);
                console.log(`Emails sent successfully to: ${allEmails.join(", ")}`);
            } catch (emailError) {
                console.error("Error sending email:", emailError);
            }
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
        const admin = await checkAdmin(req.userId, "ADMIN", res);
        if (admin.error) {
            return res.status(400).json({ message: admin.message });
        }
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
                id: { in: projectId, adminId: req.userId },
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

const countProjects = async (req, res, next) => {
    const admin = await checkAdmin(req.userId, "ADMIN", res);
    if (admin.error) {
        return res.status(400).json({ message: admin.message });
    }
    try {
        const count = await prisma.project.count({
            where: {
                adminId: req.userId,
            },
        });
        res.status(200).json({ message: "Total project count successfully", count });
    } catch (error) {
        next(error);
    }
};

export { createProject, getAllProjects, getProjectById, deleteProjectById, searchProjectByName, updateProjectById, bulkDeleteProjectById, countProjects };
