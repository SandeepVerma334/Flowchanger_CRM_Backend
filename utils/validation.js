import z from 'zod';

const UnitType = z.enum(["GB", "TB", "MB"]); // Define your enum values accordingly
const statusType = z.enum(["REFUNDED", "VERIFIED", "PENDING", "FAILED"]); // Define your enum values accordingly

const packageSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  packageNumber: z.number().int().nonnegative().optional(),
  numberOfProjects: z.number().int().nonnegative().min(1, "Number of projects must be at least 1"),
  price: z.number({ required_error: "Price is required" }).positive(),
  storageLimit: z.number({ required_error: "Storage limit is required" }).int().nonnegative(),
  unit: UnitType.default("GB"),
  numberOfClients: z.number({ required_error: "Client is required" }).nonnegative(),
  validityTerms: z.array(z.string({ required_error: "Validity term is required" }).min(1, "Validity term cannot be empty")).default(["Monthly"]),
  description: z.string().nullable().optional(),
  modules: z.array(z.string({ required_error: "Modules are required" }), { required_error: "At least one module must be selected" }),
  // adminId: z.string({ required_error: "Admin ID is required" }).uuid(),
  // adminId: z.string().optional(),
});

const BranchSchema = z.object({
  branchName: z.string().min(1, "Branch Name is required"),
});

const DepartmentSchema = z.object({
  departmentName: z.string().min(1, "Department Name is required"),
});

const staffDetailSchema = z.object({
  userId: z.string().min(1, "User ID is required"), // Unique and required
  jobTitle: z.string().min(1, "Job Title is required").optional().nullable(),
  mobileNumber: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number cannot exceed 15 digits")
    .optional()
    .nullable(),
  loginOtp: z.number().min(100000).max(999999).optional().nullable(), // 6-digit OTP
  gender: z.enum(["Male", "Female", "Other"]).optional().nullable(),
  officialMail: z.string().email("Invalid email format").optional().nullable(),
  dateOfJoining: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .optional()
    .nullable(),
  address: z.string().min(1, "Address is required").optional().nullable(),
  branchId: z.string().min(1, "Branch ID is required"), // Foreign key
  departmentId: z.string().min(1, "Department ID is required"), // Foreign key
  roleId: z.string().min(1, "Role ID is required"), // Foreign key
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
  name: z.string().min(3, 'Name must be at least 3 characters long'),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits long'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const adminSignupSchema = z.object({
  firstName: z.string({ required_error: "First Name is required" }).min(3, "First name must be at least 3 characters"),
  lastName: z.string({ required_error: "Last Name is required" }).min(3, "Last name must be at least 3 characters"),
  email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
  date_Of_Birth: z.string().optional(),
  date_Of_Joining: z.string().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  mobile: z.string({ required_error: "Mobile number is required" }).min(10, "Mobile number must be at least 10 digits").optional(),
  designation: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  password: z.string({ required_error: "Password is required" }).min(8, "Password must be at least 8 characters"),
  businessType: z.string().optional(),
  services: z.array(z.string()).optional(),
  companySize: z.string().optional(),
  role: z.string().optional(),
  packageId: z.string().optional(),
});

const transactionSchema = z.object({
  subscriptionId: z.string({ required_error: "Subscription ID is required" }).uuid({ message: "Invalid subscription ID" }),
  amount: z.coerce.number({ required_error: "Price is required", invalid_type_error: "Price must be a non-negative number" }).nonnegative(),
  currency: z.string({ required_error: "Currency is required" }),
  paymentType: z.string({ required_error: "Payment type is required" }),
  status: statusType.default("PENDING"),
  paymentId: z.string({ required_error: "Payment ID is required" }),
  message: z.string({ required_error: "Message is required" }).optional(),
  adminId: z.string({ required_error: "Admin ID is required" }),
  invoiceUrl: z.string({ required_error: "Invoice URL is required" }).url({ message: 'Invalid URL format' }).optional(),
});

const clientSchema = z.object({
  name: z.string({
    required_error: "Name is required",
    invalid_type_error: "Name must be a string"
  }).min(1, "Name cannot be empty"),

  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a valid string"
  }).email("Invalid email format"),

  phoneNumber: z.string({
    required_error: "Phone Number is required",
    invalid_type_error: "Phone Number must be a string"
  }),

  group: z.string({
    required_error: "Group is required",
    invalid_type_error: "Group must be a string"
  }),

  currency: z.string({
    required_error: "Currency is required",
    invalid_type_error: "Currency must be a string"
  }),

  defaultLanguage: z.string({
    required_error: "Default Language is required",
    invalid_type_error: "Default Language must be a string"
  }),

  // Company Details
  organizationName: z.string({
    required_error: "Organization Name is required",
    invalid_type_error: "Organization Name must be a string"
  }),

  website: z.string({
    required_error: "Website is required",
    invalid_type_error: "Website must be a valid URL"
  }).url("Invalid website URL"),

  industriesField: z.string().optional(),

  gstNumber: z.string({
    required_error: "GST Number is required",
    invalid_type_error: "GST Number must be a string"
  }),

  vatNumber: z.string({
    required_error: "VAT Number is required",
    invalid_type_error: "VAT Number must be a string"
  }),

  panNumber: z.string({
    required_error: "PAN Number is required",
    invalid_type_error: "PAN Number must be a string"
  }),
  password: z.string(
    {
      required_error: "Password is required",
      invalid_type_error: "Password must be a string",
    }
  ).min(6, 'Password must be at least 6 characters long'),
  // Address
  pinCode: z.string({
    required_error: "Pin Code is required",
    invalid_type_error: "Pin Code must be a string"
  }),

  city: z.string({
    required_error: "City is required",
    invalid_type_error: "City must be a string"
  }),

  state: z.string({
    required_error: "State is required",
    invalid_type_error: "State must be a string"
  }),

  country: z.string({
    required_error: "Country is required",
    invalid_type_error: "Country must be a string"
  }),

  addressLine: z.string().optional()
});

// create project validations



export { BranchSchema, DepartmentSchema, staffDetailSchema, subscriptionSchema, superAdminDetailsSchema, transactionSchema, packageSchema, clientSchema };