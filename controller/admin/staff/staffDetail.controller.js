import { PrismaClient } from "@prisma/client";
import { staffDetailSchema } from "../../../utils/validation.js";
const prisma = new PrismaClient();

const createStaff = async (req, res) => {
  const { success, data, error: validationError } = staffDetailSchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({
      error: "Invalid data format",
      issues: validationError.errors.map((err) => err.message),
    });
  }
  try {
    const staff = await prisma.staffDetails.create({
      data: {
        userId: data.userId,
        jobTitle: data.jobTitle || null,
        mobileNumber: data.mobileNumber || null,
        loginOtp: data.loginOtp || null,
        gender: data.gender || null,
        officialMail: data.officialMail || null,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : null, // Ensure correct date format
        address: data.address || null,
        branchId: data.branchId,
        departmentId: data.departmentId,
        roleId: data.roleId,
      },
    });
    res.status(201).json({ message: "Staff created successfully", staff });
  } catch (error) {
    console.error("Error creating staff:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ error: "Duplicate entry, staff already exists" });
    }
    res.status(500).json({ error: "Failed to create staff" });
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

// get by staff by id
const getStaffById = async (req, res) => {
  try {
    const staff = await prisma.staffDetails.findUnique({
      where: { id: req.params.id },
    });
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }
    res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
}

// update staff by id
const updateStaff = async (req, res) => {
  try {
    const staff = await prisma.staffDetails.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.status(200).json({message: "staff detail updated successfully", staff});
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ error: "Failed to update staff" });
  }
};

// delete staff by id
const deleteStaff = async (req, res) => {
  try{
    const staff = await prisma.staffDetails.delete({
      where:{id: req.params.id}
    });
    res.status(200).json({message: "staff deleted successfully", staff});
  }catch(error){
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
}

export { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff };