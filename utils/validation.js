// const z = require("zod");
import { z } from "zod";

const staffDetailSchema = z.object({
  name: z.string().min(1, "Name is required"),
  jobTitle: z.string().min(1, "Job Title is required"),
  branch: z.string().min(1, "Branch is required"),
  department: z.string().min(1, "Department is required"),
  role: z.string().min(1, "Role is required"),
  mobileNumber: z
    .string().min(1, "Mobile number is required!"),
  loginOtp: z.number().min(100000).max(999999), // 6-digit OTP
  gender: z.enum(["Male", "Female", "Other"], { message: "Invalid gender" }),
  officialEmail: z.string().email("Invalid email format"),
  dateOfJoining: z.coerce.date(),
  address: z.string().min(1, "Address is required"),
  userId: z.string().min(1, "User ID is required"),
});


const subscriptionSchema = z.object({
  adminId: z.string({ required_error: "User ID is required" }).min(1, "User ID cannot be empty"),
  packageId: z.string({ required_error: "Package ID is required" }).min(1, "Package ID cannot be empty"),
  planType: z.string({ required_error: "Plan type is required" }).min(1, "Plan type cannot be empty"),
  packageTenure: z.string({ required_error: "Package tenure is required" }).min(1, "Package tenure cannot be empty"),
  startDate: z.coerce.date({ required_error: "Start date is required", invalid_type_error: "Invalid start date format" }),
  endDate: z.coerce.date({ required_error: "End date is required", invalid_type_error: "Invalid end date format" }),
  paymentMethod: z.string({ required_error: "Payment method is required" }).min(1, "Payment method cannot be empty"),
  price: z.coerce.number({ required_error: "Price is required", invalid_type_error: "Price must be a non-negative number" }).nonnegative(),
  status: z.string({ required_error: "Status is required" }).min(1, "Status cannot be empty"),
  paid: z.boolean().default(false),
});


const superAdminDetailsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export { staffDetailSchema, subscriptionSchema, superAdminDetailsSchema };
import z from 'zod';

export const BranchSchema = z.object({
    branchName: z.string().min(1, "Branch Name is required"),
});

export const DepartmentSchema = z.object({
    departmentName: z.string().min(1, "Department Name is required"),
});
