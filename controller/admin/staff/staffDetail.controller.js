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

export { createStaff };