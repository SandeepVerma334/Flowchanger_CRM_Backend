import z, { optional } from 'zod';

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
  adminId: z.string().optional(),
});

const BranchSchema = z.object({
  branchName: z.string().min(1, "Branch Name is required"),
});

const DepartmentSchema = z.object({
  departmentName: z.string().min(1, "Department Name is required"),
});

const staffDetailSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  porfileImage: z.string().optional(),
  mobile: z
    .string()
    .min(10, "Mobile number must be at least 10 digits")
    .max(15, "Mobile number cannot exceed 15 digits").optional(),
  mobile2: z.string().optional(),
  officialMail: z.string().optional(),
  loginOtp: z.number().optional(),
  jobTitle: z.string().optional(),
  password: z.string().optional(),
  employeeId: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  dateOfJoining: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date format" })
    .optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  branchId: z.string().uuid("Branch ID must be a valid UUID").optional(),
  departmentId: z.string().uuid("Department ID must be a valid UUID").optional(),
  roleId: z.string().uuid("Role ID must be a valid UUID").optional(),
  cityOfresidence: z.string().optional(),
  adminId: z.string().optional(),
  offerLetter: z.string().optional(),
  guarantorForm: z.string().optional(),
  birthCertificate: z.string().optional(),
  degreeCertificate: z.string().optional(),
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

const adminSignupSchema = z.object({
  firstName: z.string({ required_error: "First Name is required" }).min(3, "First name must be at least 3 characters"),
  lastName: z.string({ required_error: "Last Name is required" }).min(3, "Last name must be at least 3 characters"),
  email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
  dateOfBirth: z.string().optional(),
  dateOfJoining: z.string().optional(),
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
  officeStartTime: z.string().optional(),
  officeEndtime: z.string().optional(),
  officeWorkinghours: z.string().optional(),
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

const allPermissionSchema = z.object({
  clients_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  projects_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  report_permissions: z
    .object({
      view_global: z.boolean().default(false).optional(),
      view_time_sheets: z.boolean().default(false).optional(),
    })
    .optional(),
  staff_role_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  settings_permissions: z
    .object({
      view_global: z.boolean().default(false).optional(),
      view_time_sheets: z.boolean().default(false).optional(),
    })
    .optional(),
  staff_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  task_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  sub_task_permissions: z
    .object({
      create: z.boolean().default(false).optional(),
      edit: z.boolean().default(false).optional(),
      delete: z.boolean().default(false).optional(),
      view_global: z.boolean().default(false).optional(),
    })
    .optional(),
  chat_module_permissions: z
    .object({
      grant_access: z.boolean().default(false).optional(),
    })
    .optional(),
  ai_permissions: z
    .object({
      grant_access: z.boolean().default(false).optional(),
    })
    .optional(),
});

const idSchema = z.string().uuid("Invalid UUID format");

const roleNameSchema = z
  .string()
  .optional();

const newRoleSchema = z.object({
  roleName: roleNameSchema.min(2, "role name is required"),
  permissions: allPermissionSchema.optional(),
});

const updateRoleSchema = z.object({
  role_name: roleNameSchema.optional(),
  permissions: allPermissionSchema.optional(),
});

const PunchInSchema = z.object({
  punchInMethod: z
    .string()
    .refine((value) => ["BIOMETRIC", "QRSCAN", "PHOTOCLICK"].includes(value), {
      message:
        "PunchInType Type must be either 'BIOMETRIC', 'QRSCAN' Or 'PHOTOCLICK'.",
    })
    .optional(),
  biometricData: z.string().optional(), // Only required for biometric
  qrCodeValue: z.string().optional(), // Only required for QR scan
  photoUrl: z.string().optional(), // Required for photo click
  location: z.string().min(1, { message: "Location is required." }),
  fine: z.string().optional(),
});

const PunchOutSchema = z.object({
  punchOutMethod: z
    .string()
    .refine((value) => ["BIOMETRIC", "QRSCAN", "PHOTOCLICK"].includes(value), {
      message:
        "PunchInType Type must be either 'BIOMETRIC', 'QRSCAN' Or 'PHOTOCLICK'.",
    })
    .optional(),
  biometricData: z.string().optional(), // Only required for biometric
  qrCodeValue: z.string().optional(), // Only required for QR scan
  photoUrl: z.string().optional(), // Required for photo click
  location: z.string().min(1, { message: "Location is required." }),
  overtime: z.string().optional(),
  // staffId: z.string().min(1, { message: "Staff ID is required." }),
});

const PunchRecordsSchema = z.object({
  punchInId: z.string().min(1, { message: "PunchInId is required." }),
  punchOutId: z.string().min(1, { message: "PunchOutId is required." }),
  staffId: z.string().min(1, { message: "StaffId is required." }),
});

const FineSchema = z
  .object({
    staffId: z.string().uuid("Invalid staff ID"), // UUID format check
    lateEntryFineAmount: z
      .number({ invalid_type_error: "Late Entry Fine Amount must be a number" })
      .min(1, "Late Entry Fine Amount is required"),
    lateEntryAmount: z
      .number({ invalid_type_error: "Late Entry Amount must be a number" })
      .min(0, "Late Entry Amount must be a positive number"),
    excessBreakFineAmount: z
      .number({
        invalid_type_error: "Excess Break Fine Amount must be a number",
      })
      .optional(),
    excessBreakAmount: z
      .number({ invalid_type_error: "Excess Break Amount must be a number" })
      .min(0, "Excess Break Amount must be a positive number")
      .optional(),
    earlyOutFineAmount: z
      .number({ invalid_type_error: "Early Out Fine Amount must be a number" })
      .optional(),
    earlyOutAmount: z
      .number({ invalid_type_error: "Early Out Amount must be a number" })
      .min(0, "Early Out Amount must be a positive number")
      .optional(),
    totalAmount: z
      .number({ invalid_type_error: "Total Amount must be a number" })
      .min(0, "Total Amount must be a positive number"),
    shiftIds: z.string().optional(), // Array of strings for shift IDs
  })
  .strict(); // Ensures no extra fields are allowed

const OverTimeSchema = z.object({
  earlyCommingEntryAmount: z
    .number({
      invalid_type_error: "Early Comming Entry Amount must be a number",
    })
    .default(1)
    .optional(),
  earlyEntryAmount: z
    .number({ invalid_type_error: "Early Entry Amount must be a number" })
    .default(0)
    .optional(),
  lateOutOvertimeAmount: z
    .number({ invalid_type_error: "Late Out Overtime Amount must be a number" })
    .default(1)
    .optional(),
  lateOutAmount: z
    .number({ invalid_type_error: "Late Out Amount must be a number" })
    .default(0)
    .optional(),
  totalAmount: z
    .number({ invalid_type_error: "Total Amount must be a number" })
    .default(0)
    .optional(),
  staffId: z.string().nullable().optional(),
});


const projectSchema = z.object({
  // adminId: z.string().uuid("Invalid admin ID"),
  id: z.string().optional(),
  projectName: z.string().optional(),
  progressBar: z.number().optional(),
  estimatedHours: z.number().optional(),
  members: z.array(z.string()).min(1, "At least one staff ID is required"),
  customer: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  description: z.string().optional(),
  sendMail: z.boolean().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  contactNotifications: z.array(z.string()).optional(),
  visibleTabs: z.array(z.string()).optional(),
});

const taskSchema = z.object({
  subject: z.string().optional(),
  hourlyRate: z.string().regex(/^(\d+)(\.\d{1,2})?$/, "Hourly rate must be a valid number"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid start date" }),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid due date" }),
  priority: z.string().optional(),
  repeateEvery: z.string().optional(),
  relatedTo: z.string().optional(),
  insertChecklishtTemplates: z.string().default(false),
  postingDate: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid posting date" }).optional(),
  description: z.string().optional(),
  public: z.boolean().default(false),
  billable: z.boolean().default(false),
  attachFiles: z.array(z.string()).optional(),
  assignedBy: z.array(z.string()).min(1, "At least one staff ID is required"),
});


const discussionSchema = z.object({
  subject: z.string({ required_error: "Subject is required" }).min(1, "Subject is required"),
  description: z.string({ required_error: "Description is required" }).min(1, "Description is required"),
  tags: z.array(z.string()).optional(),
  attachFiles: z.array(z.string()).optional(),
  userId: z.string({ required_error: "User ID is required" }).uuid("Invalid USER ID format"),
});
const noteSchema = z.object({
  title: z.string({ required_error: "Title is required" }).min(3, "At least 3 characters"),
  description: z.string({ required_error: "Description is required" }).min(3, "At least 3 characters required"),
  color: z.string({ required_error: "Color is required" }).min(3, "At least 3 characters required"),
  userId: z.string({ required_error: "User ID is required" }).uuid("Invalid USER ID format"),
});

const ReportStatus = Object.freeze({
  PENDING: "PENDING",
  REJECTED: "REJECTED",
  RESOLVED: "RESOLVED",
  IN_PROGRESS: "IN_PROGRESS",
  ESCALATED: "ESCALATED",
});

const reportSchema = z.object({
  name: z.string({ required_error: "Report name is required" }).min(3, "Report name must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters").optional(),
  subject: z.string({ required_error: "Report subject is required" }).min(3, "Subject must be at least 3 characters"),
  userId: z.string({ required_error: "User ID is required" }).uuid("Invalid User ID format"),
  adminId: z.string({ required_error: "Admin ID is required" }).uuid("Invalid Admin ID format"),
  // token: z.string({ required_error: "Token is required" }).min(3, "Token must be at least 3 characters"),
  status: z.nativeEnum(ReportStatus, {
    invalid_type_error: "Status must be a valid report status (PENDING, REJECTED, RESOLVED, IN_PROGRESS, ESCALATED)",
  }).default(ReportStatus.PENDING),
});

// education schema
const StaffEducationQualificationSchema = z.object({
  instituteName: z.string({ required_error: "Institute name is required!" }),
  department: z.string().optional(),
  course: z.string({ required_error: "Course name is required!" }),
  location: z.string({ required_error: "location is required!" }),
  startDate: z.string({ required_error: "Start date is required!" }),
  endDate: z.string({ required_error: "End date is required!" }),
  discription: z.string({ required_error: "Discription is required!" }),
  staffId: z.string({ required_error: "StaffId is required!" }).uuid("Invalid Admin ID format"),
  adminId: z.string().optional(),
});

// financial details schema
const StaffFinancialDetailsSchema = z.object({
  bankName: z.string({ required_error: "Bank name is required!" }),
  accountNumber: z.string({ required_error: "Account number is required!" }),
  accountName: z.string({ required_error: "Account name is required!" }),
  ifscCode: z.string({ required_error: "IFSC code is required!" }),
  branchName: z.string({ required_error: "Branch name is required!" }),
  pinCode: z.string({ required_error: "Pin Code is required!" }),
  state: z.string({ required_error: "State is required!" }),
  staffId: z.string({ required_error: "StaffId is required!" }).uuid("Invalid Admin ID format"),
});

const AttendanceStatus = Object.freeze({
  PERSENT: "PRESENT",
  ABSENT: "ABSENT",
  HALF_DAY: "HALF_DAY",
  PAID_LEAVE: "PAID_LEAVE",
  OVERTIME: "OVERTIME",
  FINE: "FINE",
  WEEK_OFF: "WEEK_OFF",
});

const EarningsSchema = z.object({
  heads: z.string().optional(),
  calculation: z.string().optional(),
  amount: z.number().optional(),
  salaryMonth: z.string().optional(),
});

const DeductionsSchema = z.object({
  heads: z.string().optional(),
  calculation: z.string().optional(),
  amount: z.number().optional(),
  deductionMonth: z.string().optional(),
});

const EmployerContributionSchema = z.object({
  type: z.string({ required_error: 'type is required' }),
  calculation: z.string().optional(),
  amount: z.number({ required_error: 'amount is required' }),
  state: z.string().optional(),
  contributionMonth: z.string({ required_error: 'contributionMonth is required' }),
  selectedEarnings: z.array(z.string(), { required_error: 'selectedEarnings is required' }),
});

const EmployeeContributionSchema = z.object({
  type: z.string({ required_error: 'type is required' }),
  calculation: z.string().optional(),
  amount: z.number({ required_error: 'amount is required' }),
  state: z.string().optional(),
  contributionMonth: z.string({ required_error: 'contributionMonth is required' }),
  selectedEarnings: z.array(z.string(), { required_error: 'selectedEarnings is required' }),
});

const SalarySchema = z.object({
  effectiveDate: z.string({ required_error: 'effectiveDate is required' }).datetime(),
  salaryType: z.enum(["Monthly", "Annual"], { required_error: 'salaryType is required' }),
  ctcAmount: z.number({ required_error: 'ctcAmount is required' }),
  staffId: z.string({ required_error: 'staffId is required' }).uuid(),
  earnings: z.array(EarningsSchema, { required_error: 'earnings are required' }),
  deductions: z.array(DeductionsSchema).optional(),
  employerContributions: z.array(EmployerContributionSchema, { required_error: 'employerContributions are required' }),
  employeeContributions: z.array(EmployeeContributionSchema, { required_error: 'employeeContributions are required' }),
});

// attendance staff
const AttendanceSchema = z.object({
  attendanceId: z.string().optional(),
  adminId: z.string().optional(),
  staffId: z.string({ required_error: "StaffId is required!" }).uuid("Invalid Admin ID format"),
  shift: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  status: z.nativeEnum(AttendanceStatus, {
    invalid_type_error: "Status must be a valid report status (PERSENT, ABSENT, HALF_DAY, PAID_LEAVE, OVERTIME, FINE, WEEK_OFF)",
  }).default(AttendanceStatus.PERSENT),
});

const AttendanceBreakRecordSchema = z.object({
  startBreak: z.string().optional(),
  endBreak: z.string().optional(),
  attendanceId: z.string({
    required_error: "AttendanceId is required!"
  }).uuid("Invalid Attendance ID format"),
  location: z.string().optional(),
  staffId: z.string({
    required_error: "StaffId is required!",
  }).uuid("Invalid Staff ID format"),
  startBreakImage: z.string().optional(),
  endBreakImage: z.string().optional(),
});

const BankDetailsStatus = Object.freeze({
  Avtive: "ACTIVE",
  INACTIVE: "INACTIVE",
});

const bankDetailsSchema = z.object({
  bankName: z.string().min(1, "Bank name is required").max(100, "Bank name should be less than 100 characters"),
  accountNumber: z.string().min(1, "Account number is required").max(20, "Account number should be less than 20 characters"),
  ifsc: z.string().min(1, "IFSC code is required").max(20, "IFSC code should be less than 20 characters"),
  country: z.string().min(1, "Country is required").max(100, "Country name should be less than 100 characters"),
  branch: z.string().min(1, "Branch is required").max(100, "Branch name should be less than 100 characters"),
  accountHolderName: z.string().min(1, "Account holder name is required").max(100, "Account holder name should be less than 100 characters"),
  // accountStatus: z.enum(["ACTIVE", "INACTIVE"], "Account status must be either ACTIVE or INACTIVE"), 
  accountStatus: z.nativeEnum(BankDetailsStatus, {
    invalid_type_error: "Account status must be either ACTIVE or INACTIVE",
  }),
  staffId: z.string().uuid("Invalid staff ID format"),
  // adminId: z.string().uuid("Invalid admin ID format"),
});

export { BranchSchema, DepartmentSchema, staffDetailSchema, subscriptionSchema, idSchema, superAdminDetailsSchema, transactionSchema, packageSchema, clientSchema, newRoleSchema, projectSchema, taskSchema, adminSignupSchema, updateRoleSchema, noteSchema, discussionSchema, reportSchema, StaffEducationQualificationSchema, StaffFinancialDetailsSchema, AttendanceSchema, AttendanceBreakRecordSchema, OverTimeSchema, FineSchema, bankDetailsSchema, SalarySchema };
