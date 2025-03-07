import { PrismaClient } from "@prisma/client";
import { staffDetailSchema } from "../../../utils/validation.js";
const prisma = new PrismaClient();

import { v4 as uuidv4 } from "uuid";

const createStaff = async (req, res) => {
  const validation = staffDetailSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data format",
      issues: validation.error.issues[0].message,
    });
  }

  const {
    firstName,
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
    adminId,
  } = validation.data;

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
      where: { id: adminId },
    });

    if (!admin || admin.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only an admin can create staff!",
      });
    }

    // Generate unique employee ID
    const uniqueEmployeeId = `FLOW#${uuidv4().replace(/-/g, "").substring(0, 5)}`;

    // Create new staff user
    const user = await prisma.user.create({
      data: {
        name: firstName,
        mobile,
        role: "STAFF",
        email: officialMail,
        otp: loginOtp ? parseInt(loginOtp) : null,
        adminId,

        staffDetails: {
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
            adminId,
          },
        },
      },
    });

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
    const staff = await prisma.staffDetails.findMany({
      where: {
        role: "STAFF",
        adminId: req.userId,
      },
      include: {
        User: true,
        Role: true,
        Department: true,
        Branch: true,
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
    const staff = await prisma.staffDetails.findUnique({
      where: { id: req.userId },
      include: {
        User: true,
        Role: true,
        Department: true,
        Branch: true,
      },
    });

    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

// Update Staff by ID
const updateStaff = async (req, res) => {
  const { id } = req.params;

  // Validate incoming data
  const validation = staffDetailSchema.partial().safeParse(req.body);
  
  if (!validation.success) {
    return res.status(400).json({
      error: "Invalid data format",
      issues: validation.error.issues.map((err) => err.message),
    });
  }

  try {
    const {
      firstName,
      mobile,
      officialMail,
      loginOtp,
      jobTitle,
      gender,
      dateOfJoining,
      dateOfBirth,
      address,
      branchId,
      departmentId,
      roleId,
      adminId,
    } = validation.data;

    console.log("Incoming Data:", validation.data);

    // Ensure date fields are properly formatted
    const formattedDateOfJoining = dateOfJoining ? new Date(dateOfJoining) : undefined;
    const formattedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;

    console.log("Formatted Dates:", {
      dateOfJoining: formattedDateOfJoining,
      dateOfBirth: formattedDateOfBirth,
    });

    // Check if the staff member exists
    const existingStaff = await prisma.staffDetails.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // Update user details (if necessary)
    await prisma.user.update({
      where: { id },
      data: {
        name: firstName,
        mobile,
        email: officialMail,
        otp: loginOtp ? parseInt(loginOtp) : null,
      },
    });

    // Construct update data, excluding undefined values
    const updateData = {
      jobTitle,
      branchId,
      departmentId,
      roleId,
      gender,
      address,
      adminId,
    };

    // Add formatted dates only if they exist
    if (formattedDateOfJoining) updateData.dateOfJoining = formattedDateOfJoining;
    if (formattedDateOfBirth) updateData.dateOfBirth = formattedDateOfBirth;

    console.log("Final Update Data:", updateData);

    // Update staff details
    const updatedStaff = await prisma.staffDetails.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      message: "Staff details updated successfully",
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Error updating staff:", error);

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Staff not found" });
    }

    return res.status(500).json({ error: "Failed to update staff" });
  }
};


// Delete Staff by ID
const deleteStaff = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if staff exists
    const existingStaff = await prisma.staffDetails.findUnique({
      where: { id },
    });

    if (!existingStaff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // Delete the staff details first
    await prisma.staffDetails.delete({
      where: { id },
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
    const staff = await prisma.staffDetails.findMany({
      where: {
        OR: [
          { firstName: { contains: search } },
          { email: { contains: search } },
          { mobile: { contains: search } },
        ],
      },
      include: {
        User: true,
        Role: true,
        Department: true,
        Branch: true,
      },
    });

    res.status(200).json(staff);
  } catch (error) {
    console.error("Error searching staff:", error);
    res.status(500).json({ error: "Failed to search staff" });
  }
}

export { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff };