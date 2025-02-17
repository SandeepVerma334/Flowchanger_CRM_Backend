import { PrismaClient } from "@prisma/client";
import { staffDetailSchema } from "../../../utils/validation.js";
const prisma = new PrismaClient();

const createStaff = async (req, res) => {
  const { success, data, error: validationError } = staffDetailSchema.safeParse(req.body);

  if (!success) {
    return res.status(400).json({
      error: "Invalid data format",
      issues: validationError.errors.map(err => err.message),
    });
  }

  try {
    const staff = await prisma.staffDetail.create({
      data: {
        name: data.name,
        jobTitle: data.jobTitle,
        branch: data.branch,
        department: data.department,
        role: data.role,
        mobileNumber: data.mobileNumber,
        loginOtp: data.loginOtp,
        gender: data.gender,
        officialEmail: data.officialEmail,
        dateOfJoining: data.dateOfJoining,
        address: data.address,
        userId: data.userId,
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
    const staff = await prisma.staffDetail.findMany();
    res.status(200).json(staff);
  } catch (error) {
    console.error("Error fetching staff:", error);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
};

// get by staff by id
const getStaffById = async (req, res) => {
  try {
    const staff = await prisma.staffDetail.findUnique({
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
    const staff = await prisma.staffDetail.update({
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
    const staff = await prisma.staffDetail.delete({
      where:{id: req.params.id}
    });
    res.status(200).json({message: "staff deleted successfully", staff});
  }catch(error){
    console.error("Error deleting staff:", error);
    res.status(500).json({ error: "Failed to delete staff" });
  }
}

export { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff };