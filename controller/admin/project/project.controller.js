import prisma from "../../../prisma/prisma.js";
import { projectSchema } from "../../../utils/validation.js";
// import sendEmail from "../../../utils/sendEmail.js";
const createProject = async (req, res) => {
    try {
        // Validate input data
        const validatedData = projectSchema.parse(req.body);
        
        // Check if the admin exists and has the right role
        const admin = await prisma.user.findUnique({
            where: { id: req.userId }
        });

        if (!admin) {
            return res.status(400).json({
                status: false,
                message: "Admin not found",
            });
        }

        if (admin.role !== "ADMIN") {
            return res.status(403).json({
                status: false,
                message: "Unauthorized access",
            });
        }

        // Destructure necessary fields
        const { 
            projectName, customer, progressBar, estimatedHours, startDate, deadline, description, sendMail, 
            contactNotifications, visibleTabs, 
            permissions 
        } = validatedData;

        // Create the project with nested permissions
        const project = await prisma.project.create({
            data: {
                projectName,
                customer,
                progressBar,
                estimatedHours,
                startDate,
                deadline,
                description,
                sendMail,
                contactNotifications,  // Array field
                visibleTabs,  // Array field
                ProjectPermissions: {
                    create: {
                        ...permissions // Spread permissions object
                    }
                }
            },
            include: { ProjectPermissions: true } // Include permissions in response
        });

        // Return success response
        res.status(201).json({
            status: true,
            message: "Project created successfully",
            data: project
        });

    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({
            status: false,
            message: "Failed to create project",
            error: error.message
        });
    }
};

export { createProject };
