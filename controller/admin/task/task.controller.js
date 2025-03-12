import prisma from "../../../prisma/prisma.js";
import { taskSchema } from "../../../utils/validation.js";
import { pagination } from "../../../utils/pagination.js";

const createTask = async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = taskSchema.parse(req.body);
        console.log("Validated Data:", validatedData); // Debugging

        // Ensure `assignedBy` is an array
        if (!Array.isArray(validatedData.assignedBy) || validatedData.assignedBy.length === 0) {
            return res.status(400).json({
                status: false,
                message: "AssignedBy must be a non-empty array of user IDs",
            });
        }
        const getAllProjects = await prisma.project.findMany({
            select: {
                id: true,
                projectName: true
            },
        });
        console.log(getAllProjects)
        // Manually assign values from validated data
        const task = await prisma.task.create({
            data: {
                subject: validatedData.subject,
                hourlyRate: validatedData.hourlyRate,
                startDate: new Date(validatedData.startDate),
                dueDate: new Date(validatedData.dueDate),
                priority: validatedData.priority,
                repeateEvery: validatedData.repeateEvery,
                project:{
                    connect:{id:validatedData.relatedTo}
                },
                insertChecklishtTemplates: validatedData.insertChecklishtTemplates,
                postingDate: validatedData.postingDate ? new Date(validatedData.postingDate) : new Date(),
                description: validatedData.description,
                public: validatedData.public,
                billable: validatedData.billable,
                attachFiles: validatedData.attachFiles || [],
                // projectId: validatedData.projectId || null,
                StaffDetails: {
                    connect: validatedData.assignedBy.map((staffId) => ({ id: staffId }))
                }

            },
            include: {
                StaffDetails: true
            },
        });

        // Send success response
        res.status(201).json({
            status: true,
            message: "Task created successfully",
            data: task,
        });

    } catch (error) {
        next(error);
    }
};

// get all tasks

const getAllTasks = async (req, res,next) => {
try{
    const { page, limit } = req.query;

const tasks = await prisma.task.findMany({
    include: {
        StaffDetails: {
            include: {
                User: true, 
            },
        },
        project: true, 
    },
});

    const result = await pagination(prisma.task, { page, limit });

    return res.status(200).json({message:"Task Fetch Successfully!", data:tasks });
}catch(error){
    next(error)
}
}

// update task

const updateTask = async (req, res, next) => {
    try {
        const { taskId } = req.params; 
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        });

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
        const validatedData = taskSchema.parse(req.body); 

        console.log("Validated Data for Update:", validatedData);

        // Ensure assignedBy is an array
        if (!Array.isArray(validatedData.assignedBy) || validatedData.assignedBy.length === 0) {
            return res.status(400).json({
                status: false,
                message: "AssignedBy must be a non-empty array of user IDs",
            });
        }

        console.log("Updated Staff IDs:", validatedData.assignedBy);

        // Check if task exists
        const existingTask = await prisma.task.findUnique({
            where: { id: taskId },
            include: { StaffDetails: true }, // Fetch existing assigned staff
        });

        if (!existingTask) {
            return res.status(404).json({
                status: false,
                message: "Task not found",
            });
        }

        // Update the task
        const updatedTask = await prisma.task.update({
            where: { id: taskId },
            data: {
                subject: validatedData.subject,
                hourlyRate: validatedData.hourlyRate,
                startDate: new Date(validatedData.startDate),
                dueDate: new Date(validatedData.dueDate),
                priority: validatedData.priority,
                repeateEvery: validatedData.repeateEvery,
                project:{
                    connect:{id:validatedData.relatedTo}
                },
                insertChecklishtTemplates: validatedData.insertChecklishtTemplates,
                postingDate: validatedData.postingDate ? new Date(validatedData.postingDate) : new Date(),
                description: validatedData.description,
                public: validatedData.public,
                billable: validatedData.billable,
                attachFiles: validatedData.attachFiles || [],

                // Update assigned staff (disconnect old staff and connect new ones)
                StaffDetails: {
                    set: validatedData.assignedBy.map((staffId) => ({ id: staffId })), // Replace existing assigned staff
                },
            },
            include: {
                StaffDetails: true, // Return updated staff details
            },
        });

        res.status(200).json({
            status: true,
            message: "Task updated successfully",
            data: updatedTask,
        });

    } catch (error) {
        next(error);
    }
};

// bulk delete task api

const bulkDeleteTasks = async (req, res, next) => {
    try {
        const { taskIds } = req.body; 
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        });

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
        if (!Array.isArray(taskIds) || taskIds.length === 0) {
            return res.status(400).json({
                status: false,
                message: "taskIds must be a non-empty array of task IDs",
            });
        }
        const deletedTasks = await prisma.task.deleteMany({
            where: {
                id: { in: taskIds }, 
            },
        });

        if (deletedTasks.count === 0) {
            return res.status(404).json({
                status: false,
                message: "No tasks found with the provided IDs",
            });
        }

        res.status(200).json({
            status: true,
            message: `${deletedTasks.count} tasks deleted successfully`,
        });

    } catch (error) {
        next(error);
    }
};

//  get task by id

const getTaskById = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        });

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
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                StaffDetails: true,
            },
        });

        if (!task) {
            return res.status(404).json({
                status: false,
                message: "Task not found",
            });
        }

        res.status(200).json({
            status: true,
            message: "Task found successfully",
            data: task,
        });

    } catch (error) {
        next(error);
    }
};

// delete task by id

const deletetaskById = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        });

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
        const deletedTask = await prisma.task.delete({
            where: { id: taskId },
        });

        if (!deletedTask) {
            return res.status(404).json({
                status: false,
                message: "Task not found",
            });
        }

        res.status(200).json({
            status: true,
            message: "Task deleted successfully",
            data: deletedTask,
        });

    } catch (error) {
        next(error);
    }
};

// search task by name

const searchTasks = async (req, res, next) => {
    try {
        const { name } = req.query;
        const { page, limit } = req.query;
        const admin = await prisma.user.findUnique({
            where: {
                id: req.userId,
            }
        });

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
        const tasks = await prisma.task.findMany({
            where: {
                subject: {
                    contains: name,
                    mode: "insensitive"
                }
            }
        });
        const result = await pagination(prisma.task, { page, limit });
        res.status(200).json({ message: "Task search successful by name : " + name, data: tasks, result });
    } catch (error) {
        next(error);
    }
};

export { createTask, getAllTasks, updateTask, bulkDeleteTasks, getTaskById, deletetaskById, searchTasks }
