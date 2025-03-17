import { staffDetailSchema } from "../../../utils/validation.js";
import checkAdmin from "../../../utils/adminChecks.js";
import prisma from "../../../prisma/prisma.js";

import { v4 as uuidv4 } from "uuid";

// create staff
const createStaff = async (req, res, next) => {
  console.log(req.body);
  try {
    const validation = staffDetailSchema.safeParse(req.body);
    console.log(req.file);
    if (!validation.success) {
      return res.status().json({
        error: "Invalid data format",
        issues: validation.error.issues.map((err) => err.message),
      });
    }
    const existingEmail = await prisma.user.findUnique({
      where: { email: validation.data.officialMail },
    });
    if (existingEmail) {
      return res.status(400).json({
        message: "Email already exists!",
      });
    }

    const admin = await checkAdmin(req.userId);
console.log(admin)
    const uniqueEmployeeId = `FLOW#-${new Date().getTime()}-${uuidv4().replace(/-/g, "").substring(0, 5)}`;
    const staffData = await prisma.user.create({
      data: {
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        password: validation.data.password,
        mobile: validation.data.mobile,
        mobile2: validation.data.mobile2,
        profileImage: validation.data.porfileImage,
        role: "STAFF",
        email: validation.data.officialMail,
        otp: validation.data.otp,
        adminId: req.userId,
        StaffDetails: {
          create: {
            jobTitle: validation.data.jobTitle,
            gender: validation.data.gender,
            dateOfJoining: new Date(validation.data.dateOfJoining),
            dateOfBirth: validation.data.dateOfBirth,
            address: validation.data.address,
            maritalStatus: validation.data.maritalStatus,
            // branchId:validation.data.branchId,
            Branch: {
              connect: {
                id: validation.data.branchId
              },
            },
            // departmentId:validation.data.departmentId,
            Department: {
              connect: {
                id: validation.data.departmentId
              },
            },
            Role: {
              connect: {
                id: validation.data.roleId
              },
            },
            // roleId:validation.data.roleId,
            employeeId: uniqueEmployeeId,
            // offerLetter: validation.data.offerLetter,
            // birthCertificate: validation.data.birthCertificate,
            // guarantorForm: validation.data.guarantorForm,
            // degreeCertificate: validation.data.degreeCertificate,
          }
        }
      },
      include: {
        StaffDetails: true
      }
    });
    return res.status(201).json({ status: 201, message: "Staff created successfully", data: staffData });

  } catch (error) {
    next(error);
  }
}

// get all staff
const getAllStaff = async (req, res) => {
  try {
    const admin = checkAdmin(req.userId, "ADMIN", res);

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
            AttendanceStaff: true,
          },
        },
      },
    });
    res.status(200).json({ message: "Staff fetched successfully", data: staff });
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

// Update staff details | profile update | 
const updateStaff = async (req, res, next) => {
  try {
    const { id } = req.params; // Get staff ID from request parameters
    console.log(req.files);
    const validation = staffDetailSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid data format",
        issues: validation.error.issues.map((err) => err.message),
      });
    }
    // console.log(staffId);
    // Check if the staff exists
    const existingStaff = await prisma.user.findUnique({
      where: { id: id },
      include: { StaffDetails: true },
    });
    if (!existingStaff) {
      return res.status(404).json({ message: "Staff not found!" });
    }

    // console.log(validation.data)

    // Update staff data
    const updatedStaff = await prisma.user.update({
      where: { id: id },
      data: {
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        password: validation.data.password,
        mobile: validation.data.mobile,
        mobile2: validation.data.mobile2,
        // profileImage: req.file.path,
        email: validation.data.officialMail,
        otp: validation.data.otp,

        StaffDetails: {
          update: {
            jobTitle: validation.data.jobTitle,
            gender: validation.data.gender,
            dateOfJoining: new Date(),
            dateOfBirth: validation.data.dateOfBirth,
            address: validation.data.address,
            maritalStatus: validation.data.maritalStatus,
            ...(validation.data.branchId && {
              Branch: {
                connect: { id: validation.data.branchId },
              },
            }),
            ...(validation.data.departmentId && {
              Department: {
                connect: { id: validation.data.departmentId },
              }
            }),
            ...(validation.data.roleId && {
              Role: {
                connect: { id: validation.data.roleId },
              },
            }),
            offerLetter: validation.data.offerLetter,
            birthCertificate: validation.data.birthCertificate,
            guarantorForm: validation.data.guarantorForm,
            degreeCertificate: validation.data.degreeCertificate,
          },
        },
      },
      include: {
        StaffDetails: {
          include: {
            Role: true,
            Department: true,
            Branch: true, // Added Branch for consistency with updateStaff
          },
        },
      }
    });

    return res.status(200).json({
      status: 200,
      message: "details updated successfully",
      data: updatedStaff,
    });
  } catch (error) {
    next(error);
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

const bulkCreateStaff = async (req, res, next) => {
  try {
    const { staffList } = req.body; // Expecting an array of staff objects

    if (!Array.isArray(staffList) || staffList.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid or empty staff list",
      });
    }

    // Extract IDs to check if they exist
    const branchIds = [...new Set(staffList.map((staff) => staff.branchId))];
    const departmentIds = [...new Set(staffList.map((staff) => staff.departmentId))];
    const roleIds = [...new Set(staffList.map((staff) => staff.roleId))];

    // Verify foreign key existence
    const existingBranches = await prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true },
    });
    const existingDepartments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true },
    });
    const existingRoles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });

    // Convert to sets for easy checking
    const validBranchIds = new Set(existingBranches.map((b) => b.id));
    const validDepartmentIds = new Set(existingDepartments.map((d) => d.id));
    const validRoleIds = new Set(existingRoles.map((r) => r.id));

    // Filter out invalid staff members
    const validStaffList = staffList.filter(
      (staff) =>
        validBranchIds.has(staff.branchId) &&
        validDepartmentIds.has(staff.departmentId) &&
        validRoleIds.has(staff.roleId)
    );

    if (validStaffList.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid branchId, departmentId, or roleId. No users created.",
      });
    }

    // Store created users
    const createdUsers = [];

    // Insert users one by one to ensure relations work
    for (const staff of validStaffList) {
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
      } = staff;

      const uniqueEmployeeId = `FLOW#${uuidv4().replace(/-/g, "").substring(0, 5)}`;

      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          password,
          mobile,
          role: "STAFF",
          email: officialMail,
          otp: loginOtp,
          adminId: req.userId,
          StaffDetails: {
            create: {
              jobTitle,
              gender,
              dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
              dateOfBirth,
              address,
              maritalStatus,
              Branch: {
                connect: {
                  id: branchId
                },
              },
              Department: {
                connect: {
                  id: departmentId
                },
              },
              Role: {
                connect: {
                  id: roleId
                },
              },
              employeeId: uniqueEmployeeId,
            },
          },
        },
      });

      createdUsers.push(user);
    }

    return res.status(201).json({
      status: true,
      message: `${createdUsers.length} staff members added successfully!`,
      data: createdUsers,
    });
  } catch (error) {
    next(error);
  }
};

// bulk update staff
const bulkUpdateStaff = async (req, res, next) => {
  try {
    const { staffList } = req.body;

    if (!Array.isArray(staffList) || staffList.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid or empty staff list",
      });
    }

    // Extract IDs to check existence
    const userIds = [...new Set(staffList.map((staff) => staff.id?.toString()).filter(Boolean))];
    const branchIds = [...new Set(staffList.map((staff) => staff.branchId).filter(Boolean))];
    const departmentIds = [...new Set(staffList.map((staff) => staff.departmentId).filter(Boolean))];
    const roleIds = [...new Set(staffList.map((staff) => staff.roleId).filter(Boolean))];
    // console.log("userIds " + userIds);
    // Verify existing users
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      // select: { id: true },
      include: { StaffDetails: true },
    });
    // console.log( existingUsers);
    const existingUserIds = new Set(existingUsers.map((u) => u?.id));
    // console.log(existingUserIds);
    // Verify foreign key existence
    const existingBranches = await prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true },
    });
    console.log("brannch Id", existingBranches);
    const existingDepartments = await prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true },
    });
    console.log("department Id", existingDepartments);
    const existingRoles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true },
    });
    // console.log("role Id", existingRoles);
    // Convert to sets for easy checking
    const validBranchIds = new Set(existingBranches.map((b) => b.id));
    const validDepartmentIds = new Set(existingDepartments.map((d) => d.id));
    const validRoleIds = new Set(existingRoles.map((r) => r.id));
    console.log(staffList);
    // Filter out invalid staff updates
    const validStaffList = staffList.filter(
      (staff) =>
        existingUserIds.has(staff.id) &&
        (!staff.branchId || validBranchIds.has(staff.branchId)) &&
        (!staff.departmentId || validDepartmentIds.has(staff.departmentId)) &&
        (!staff.roleId || validRoleIds.has(staff.roleId))
    );

    console.log("Valid Staff List:", validStaffList);

    if (validStaffList.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid userId, branchId, departmentId, or roleId. No users updated.",
      });
    }

    // Store updated users
    const updatedUsers = [];

    // Update users one by one
    for (const staff of validStaffList) {
      const {
        id, // User ID to update
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
      } = staff;

      // Check if StaffDetails exists
      const staffDetails = await prisma.staffDetails.findUnique({
        where: {
          userId: id,
        },
      });

      if (!staffDetails) {
        console.warn(`Skipping update for user ${id}, as StaffDetails not found.`);
        continue;
      }

      const updatedUser = await prisma.user.update({
        where: { id: staffDetails.userId },
        data: {
          firstName,
          lastName,
          password,
          mobile,
          email: officialMail,
          otp: loginOtp,
          StaffDetails: {
            update: {
              jobTitle,
              gender,
              dateOfJoining: dateOfJoining ? new Date(dateOfJoining) : null,
              dateOfBirth,
              address,
              maritalStatus,
              // branchId: branchId || null,
              Branch: {
                connect: {
                  id: branchId
                },
              },
              Department: {
                connect: {
                  id: departmentId
                },
              },
              Role: {
                connect: {
                  id: roleId
                },
              },
              // departmentId: departmentId || null,
              // roleId: roleId || null,
            },
          },
        },
      });

      updatedUsers.push(updatedUser);
    }

    return res.status(200).json({
      status: true,
      message: `${updatedUsers.length} staff members updated successfully!`,
      data: updatedUsers,
    });
  } catch (error) {
    next(error);
  }
};
// Bulk delete staff using ID
const bulkDeleteStaff = async (req, res, next) => {
  try {
    const { staffIds } = req.body; // IDs of the staff details you want to delete
    console.log("Received staff IDs: ", staffIds);

    if (!Array.isArray(staffIds) || staffIds.length === 0) {
      return res.status(400).json({
        status: false,
        message: "staffIds must be a non-empty array of staff IDs",
      });
    }

    // Fetch the related userIds from the staffDetails table
    const staffDetails = await prisma.staffDetails.findMany({
      where: {
        id: { in: staffIds }, // Find staff details with matching IDs
      },
      select: {
        userId: true, // Assuming `staffDetails` has a reference to `userId`
      },
    });

    // If no matching staff details were found
    if (!staffDetails || staffDetails.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No matching staff details found for the provided IDs",
      });
    }

    // Extract userIds from the staffDetails
    const userIdsToDelete = staffDetails.map(detail => detail.userId);

    // Start a transaction to ensure both tables are updated consistently
    const deleteTransaction = await prisma.$transaction([
      // First, delete the staff details based on the provided staffIds
      prisma.staffDetails.deleteMany({
        where: {
          id: { in: staffIds }, // Delete staff details with matching IDs
        },
      }),

      // Then, delete the related users in the user table based on userIds
      prisma.user.deleteMany({
        where: {
          id: { in: userIdsToDelete }, // Delete users with matching userIds
        },
      }),
    ]);

    console.log("Deleted Staff Details and Users: ", deleteTransaction);

    return res.status(200).json({
      status: true,
      message: `${deleteTransaction[0].count} staff details and ${deleteTransaction[1].count} users deleted successfully!`,
      data: {
        staffDetailsDeleted: deleteTransaction[0].count,
        usersDeleted: deleteTransaction[1].count,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff, bulkCreateStaff, bulkUpdateStaff, searchStaff, bulkDeleteStaff };
