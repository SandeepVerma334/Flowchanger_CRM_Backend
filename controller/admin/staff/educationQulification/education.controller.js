import { StaffEducationQualificationSchema } from "../../../../utils/validation.js";
import checkAdmin from "../../../../utils/adminChecks.js";
import prisma from "../../../../prisma/prisma.js";
import { pagination } from "../../../../utils/pagination.js";

const createEducationForStaff = async (req, res, next) => {
  try {
    const validation = StaffEducationQualificationSchema.parse(req.body);

    // check if admin is exists
    let adminDetails
    console.log(validation.adminId);

    if (validation.adminId && validation.adminId !== undefined) {
      adminDetails = await prisma.adminDetails.findUnique({
        where: { id: validation.adminId },
      });
    }
    console.log(adminDetails);
    
    // Check if staff exists
    const existingStaff = await prisma.staffDetails.findUnique({
      where: { id: validation.staffId },
    });

    if (!existingStaff) {
      return res.status(400).json({ error: "Invalid Staff ID. Staff does not exist." });
    }

    const educationData = await prisma.staffEducationQualification.create({
      data: {
        instituteName: validation.instituteName,
        course: validation.course,
        location: validation.location,
        startDate: validation.startDate,
        endDate: validation.endDate,
        discription: validation.discription,
        staffDetails: { connect: { id: validation.staffId } },
        ...(adminDetails && { AdminDetails: { connect: { id: validation.adminId } } }),
        department: validation.department,
      },
      include: {
        staffDetails: true,
        AdminDetails: true,
        staffEducationQualification: true
      },
    });

    return res.status(201).json({
      message: "Education record added successfully",
      data: educationData,
    });

  } catch (error) {
    next(error);
  }
};

// get all staff education

const getAllStaffEducation = async (req, res, next) => {
  try {
    const admin = checkAdmin(req.userId, "ADMIN", res);

    const { page = 1, limit = 10 } = req.query;
    // Assuming pagination is a helper function
    const education = await pagination(prisma.staffEducationQualification, {
        page,
        limit,
      include: {
        staffDetails: true,
        AdminDetails: true,
      },
    });

    return res.status(200).json({ data: education });
  } catch (error) {
    next(error);
  }
};

// get single staff education by id

const getStaffEducationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = checkAdmin(req.userId, "ADMIN", res);

    const education = await prisma.staffEducationQualification.findUnique({
      where: { id: id },
      include: {
        staffDetails: true,
        AdminDetails: true,
      },
    });

    if (!education) {
      return res.status(404).json({ error: "Education record not found" });
    }

    return res.status(200).json({ data: education });
  } catch (error) {
    next(error);
  }
}

// delete staff education by id
const deleteStaffEducationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = checkAdmin(req.userId, "ADMIN", res);

    const education = await prisma.staffEducationQualification.findUnique({
      where: { id: id },
    });

    if (!education) {
      return res.status(404).json({ error: "Education record not found" });
    }

    await prisma.staffEducationQualification.delete({
      where: { id: id },
    });

    return res.status(200).json({ message: "Education record deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// search staff education by name
const searchStaffEducation = async (req, res, next) => {
  try {
    const { instituteName } = req.query;
    const { page, limit } = req.query;
    const admin = checkAdmin(req.userId, "ADMIN", res);
    const education = await pagination(prisma.staffEducationQualification, {
      where: {
        instituteName: {
          contains: instituteName,
          mode: "insensitive"
        }
      },
      page, limit
    });

    if (!education) {
      return res.status(404).json({ error: "Education record not found" });
    }

    return res.status(200).json({ message: "Education record found successfully by ( " + instituteName + " )", ...education });
  } catch (error) {
    next(error);
  }
}

export { createEducationForStaff, getAllStaffEducation, getStaffEducationById, deleteStaffEducationById, searchStaffEducation };