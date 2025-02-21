import z from 'zod';

const BranchSchema = z.object({
  branchName: z.string().min(1, "Branch Name is required"),
});

const DepartmentSchema = z.object({
  departmentName: z.string().min(1, "Department Name is required"),
});

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
  adminId: z.string({ required_error: "User ID is required" }).uuid({ message: "Invalid user ID" }),
  packageId: z.string({ required_error: "Package ID is required" }).uuid({ message: "Invalid package ID" }),
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

export const adminSignupSchema = z.object({
  name: z.string({ required_error: "Name is required" }).min(3, "Name must be at least 3 characters"),
  email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
  date_Of_Birth: z.string().optional(), 
  date_Of_Joining: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  mobile: z.string({ required_error: "Mobile number is required" }).min(10, "Mobile number must be at least 10 digits"),
  designation: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  password: z.string({ required_error: "Password is required" }).min(8, "Password must be at least 8 characters"),
});

const transactionSchema = z.object({
  subscriptionId: z.string({ required_error: "Subscription ID is required" }).uuid({ message: "Invalid subscription ID" }),
  amount: z.coerce.number({ required_error: "Price is required", invalid_type_error: "Price must be a non-negative number" }).nonnegative(),
  currency: z.string({ required_error: "Currency is required" }),
  paymentType: z.string({ required_error: "Payment type is required" }),
  status: z.string({ required_error: "Status is required" }),
  paymentId: z.string({ required_error: "Payment ID is required" }),
  message: z.string({ required_error: "Message is required" }).optional(),
  adminId: z.string({ required_error: "Admin ID is required" }),
  invoiceUrl: z.string({ required_error: "Invoice URL is required" }).url({ message: 'Invalid URL format' }).optional(),
});
export { BranchSchema, DepartmentSchema, staffDetailSchema, subscriptionSchema, superAdminDetailsSchema, transactionSchema };