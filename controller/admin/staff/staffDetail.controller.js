import { PrismaClient } from "@prisma/client";
import { staffDetailSchema } from "../../../utils/validation.js";
const prisma = new PrismaClient();

import { v4 as uuidv4 } from "uuid";

const createStaff = async (req, res) => {
  const validation = staffDetailSchema.safeParse(req.body);
  // console.log("Validation:", validation);

  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data format",
      issues: validation.error.issues.map((err) => err.message),
    });
  }

  const {
    firstName,
    lastName,
    password,
    mobile,
    officialMail,
    loginOtp,
    jobTitle,
    gender,
    dateOfJoining,
    maritalStatus,
    dateOfBirth,
    address,
    branchId,
    departmentId,
    roleId,
    employeeId,
  } = validation.data;
  // console.log(validation.data);

  try {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: officialMail },
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists!",
      });
    }

    // Check if the admin exists and has the right role
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

    // Generate unique employee ID
    const uniqueEmployeeId = `FLOW#-${new Date().getTime()}-${uuidv4().replace(/-/g, "").substring(0, 5)}`;

    // Create new staff user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        password,
        mobile,
        role: "STAFF",
        email: officialMail,
        otp: loginOtp,
        // Use relation instead of adminId
        admin: {
          connect: { id: req.userId }
        },
        StaffDetails: {
          create: {
            jobTitle,
            gender,
            dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            address,
            maritalStatus,
            branchId,
            departmentId,
            roleId,
            employeeId: uniqueEmployeeId,
          },
        },
      },
      include: {
        StaffDetails: {
          select: {
            employeeId: true, // Include employeeId in the response
          },
        },
      },
    });
    console.log(user)

    res.status(201).json({ message: "Staff created successfully!", user });
  } catch (error) {
    res.status(500).json({
      error: "Failed to create staff member",
      details: error.message,
    });
  }
};

// get all staff
const getAllStaff = async (req, res) => {
  try {
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
      return res.status(400).json({ message: "Only admin can get staff!" });
    }
    const staff = await prisma.user.findMany({
      where: {
        role: "STAFF",
        adminId: req.userId,
      },
      include: {
        StaffDetails: {
          include: {
            Role: true,
            Department: true,
            Branch: true,
          },
        },
      },
    });
    res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

// Get Staff by ID
const getStaffById = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const staff = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        StaffDetails: {
          include: {
            Role: true,
            Department: true,
            Branch: true, // Added Branch for consistency with updateStaff
          },
        },
      },
    });

    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching staff details:", error);
    res.status(500).json({
      error: "Failed to fetch staff member",
      details: error.message,
    });
  }
};

// Update Staff by ID
const updateStaff = async (req, res) => {
  const { id } = req.params;
  const { jobTitle, gender, dateOfJoining, dateOfBirth, address, maritalStatus, branchId, departmentId, roleId } = req.body;

  try {
    const staff = await prisma.user.update({
      where: { id },
      data: {
        StaffDetails: {
          update: {
            jobTitle,
            gender,
            dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            address,
            maritalStatus,
            branchId,
            departmentId,
            roleId,
          },
        },
      },
      include: {
        StaffDetails: {
          include: {
            Role: true,
            Department: true,
            Branch: true,
          },
        },
      },
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.status(200).json(staff);
  } catch (error) {
    console.error("Error updating staff by ID:", error);
    res.status(500).json({ error: "Failed to update staff by ID" });
  }
};

// Delete Staff by ID
const deleteStaff = async (req, res) => {
  const { id } = req.params; // 'id' represents the user's id
  try {
    // Check if staff exists by looking up the staff details via userId
    const existingStaff = await prisma.staffDetails.findUnique({
      where: { userId: id },
    });

    if (!existingStaff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // Delete the staff details first using userId
    await prisma.staffDetails.delete({
      where: { userId: id },
    });

    // Delete the user record associated with the staff
    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({ message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.status(500).json({
      error: "Failed to delete staff member",
      details: error.message,
    });
  }
};

const searchStaff = async (req, res) => {
  const { search } = req.query;

  try {
    const staff = await prisma.user.findMany({
      where: {
        role: "STAFF",
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { mobile: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        StaffDetails: {
          include: {
            Role: true,
            Department: true,
            Branch: true,
          },
        },
      },
    });

    res.status(200).json(staff);
  } catch (error) {
    console.error("Error searching staff:", error);
    res.status(500).json({ error: "Failed to search staff" });
  }
};

export { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff, searchStaff };