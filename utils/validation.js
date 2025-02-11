// const z = require("zod");
import { z } from "zod";

export const staffDetailSchema = z.object({
    name: z.string().min(1, "Name is required"),
    jobTitle: z.string().min(1, "Job Title is required"),
    branch: z.string().min(1, "Branch is required"),
    department: z.string().min(1, "Department is required"),
    role: z.string().min(1, "Role is required"),
    mobileNumber: z
      .string().min(1,"Mobile number is required!"),
    loginOtp: z.number().min(100000).max(999999), // 6-digit OTP
    gender: z.enum(["Male", "Female", "Other"], { message: "Invalid gender" }),
    officialEmail: z.string().email("Invalid email format"),
    dateOfJoining: z.coerce.date(),
    address: z.string().min(1, "Address is required"),
    userId: z.string().min(1, "User ID is required"),
  });

