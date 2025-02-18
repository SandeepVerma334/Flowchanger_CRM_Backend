-- CreateEnum
CREATE TYPE "BankStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PunchOutMethod" AS ENUM ('BIOMETRIC', 'QRSCAN', 'PHOTOCLICK');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('GB', 'TB', 'MB');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'SALARY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED', 'SAVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "MarkAttendenceType" AS ENUM ('Office', 'Anywhere');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('VERIFIED', 'PENDING', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FineType" AS ENUM ('HOURLY', 'DAILY');

-- CreateEnum
CREATE TYPE "PunchTime" AS ENUM ('ANYTIME', 'ADDLIMIT');

-- CreateEnum
CREATE TYPE "Day" AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');

-- CreateEnum
CREATE TYPE "punchRecordStatus" AS ENUM ('ABSENT', 'PRESENT', 'HALFDAY', 'PAIDLEAVE');

-- CreateEnum
CREATE TYPE "PunchInMethod" AS ENUM ('BIOMETRIC', 'QRSCAN', 'PHOTOCLICK');

-- CreateEnum
CREATE TYPE "BreakMethod" AS ENUM ('BIOMETRIC', 'QRSCAN', 'PHOTOCLICK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "mobile" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "otp" INTEGER,
    "otpExpiresAt" TIMESTAMP(3),
    "adminId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkEntry" (
    "id" TEXT NOT NULL,
    "work_name" TEXT NOT NULL,
    "units" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attachments" TEXT,
    "location" TEXT,
    "staffDetailsId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRoom" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "content" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "package_id" TEXT,
    "company_name" TEXT,
    "company_logo" TEXT,
    "profile_image" TEXT,
    "time_format" TEXT,
    "time_zone" TEXT,
    "date_format" TEXT,
    "week_format" TEXT,

    CONSTRAINT "AdminDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "branchName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "job_title" TEXT,
    "departmentId" TEXT,
    "roleId" TEXT,
    "login_otp" TEXT,
    "gender" TEXT,
    "official_email" TEXT,
    "employee_type" TEXT,
    "employee_id" TEXT,
    "date_of_joining" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "date_of_birth" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "date_of_leaving" TIMESTAMP(3),
    "current_address" TEXT,
    "permanent_address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_mobile" TEXT,
    "emergency_contact_relation" TEXT,
    "emergency_contact_address" TEXT,
    "guardian_name" TEXT,
    "esi_number" TEXT,
    "pf_number" TEXT,
    "employment" TEXT,
    "marital_status" TEXT,
    "blood_group" TEXT,
    "branchId" TEXT,
    "applyFine" BOOLEAN NOT NULL DEFAULT false,
    "applyOvertime" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "StaffDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "department_name" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceAutomationRule" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "auto_absent" BOOLEAN NOT NULL DEFAULT false,
    "present_on_punch" BOOLEAN NOT NULL DEFAULT false,
    "auto_half_day" TEXT,
    "manadatory_half_day" TEXT,
    "manadatory_full_day" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "AttendanceAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceMode" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "selfie_attendance" BOOLEAN NOT NULL DEFAULT false,
    "qr_attendance" BOOLEAN NOT NULL DEFAULT false,
    "gps_attendance" BOOLEAN NOT NULL DEFAULT false,
    "mark_attendance" "MarkAttendenceType" NOT NULL DEFAULT 'Office',
    "allow_punch_in_for_mobile" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "AttendanceMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffBackgroundVerification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "aadhaar_number" TEXT,
    "aadhaar_verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "aadhaar_file" TEXT,
    "voter_id_number" TEXT,
    "voter_id_verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "voter_id_file" TEXT,
    "pan_number" TEXT,
    "pan_verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "pan_file" TEXT,
    "uan_number" TEXT,
    "uan_verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "uan_file" TEXT,
    "driving_license_number" TEXT,
    "driving_license_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "driving_license_file" TEXT,
    "face_file" TEXT,
    "face_verification_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "current_address" TEXT,
    "permanent_address" TEXT,
    "address_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "address_file" TEXT,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffBackgroundVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastEmployment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "company_name" TEXT NOT NULL,
    "designation" TEXT,
    "joining_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaving_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT,
    "salary" DOUBLE PRECISION,
    "company_gst" TEXT,
    "past_Employment_status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PastEmployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "bank_name" TEXT,
    "account_number" TEXT,
    "holder_name" TEXT,
    "branch_name" TEXT,
    "status" "BankStatus",
    "ifsc_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeavePolicy" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowed_leaves" INTEGER NOT NULL DEFAULT 0,
    "carry_forward_leaves" INTEGER NOT NULL DEFAULT 0,
    "policy_type" "LeaveType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "leavePolicyId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_value" TEXT NOT NULL,

    CONSTRAINT "CustomDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EarlyLeavePolicy" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "fineType" "FineType" NOT NULL DEFAULT 'HOURLY',
    "gracePeriodMins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fineAmountMins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waiveOffDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "EarlyLeavePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LateComingPolicy" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "fineType" "FineType" NOT NULL DEFAULT 'HOURLY',
    "gracePeriodMins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fineAmountMins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "waiveOffDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "LateComingPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OvertimePolicy" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "gracePeriodMins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "extraHoursPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "publicHolidayPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weekOffPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staffId" TEXT,

    CONSTRAINT "OvertimePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientsPermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "view_global" BOOLEAN NOT NULL DEFAULT false,
    "create" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientsPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectsPermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "view_global" BOOLEAN NOT NULL DEFAULT false,
    "create" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectsPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportPermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "view_global" BOOLEAN NOT NULL DEFAULT false,
    "view_time_sheets" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRolePermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "view_global" BOOLEAN NOT NULL DEFAULT false,
    "create" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffRolePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingsPermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "view_global" BOOLEAN NOT NULL DEFAULT false,
    "view_time_sheets" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettingsPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "view_global" BOOLEAN NOT NULL DEFAULT false,
    "create" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskPermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "view_global" BOOLEAN NOT NULL DEFAULT false,
    "create" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubTaskPermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "view_global" BOOLEAN NOT NULL DEFAULT false,
    "create" BOOLEAN NOT NULL DEFAULT false,
    "edit" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubTaskPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatModulePermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "grant_access" BOOLEAN NOT NULL DEFAULT false,
    "staff" BOOLEAN NOT NULL DEFAULT false,
    "client" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatModulePermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPermissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "grant_access" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "roleId" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryDetails" (
    "id" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3),
    "salary_type" TEXT,
    "ctc_amount" DOUBLE PRECISION,
    "employer_pf" DOUBLE PRECISION,
    "employer_esi" DOUBLE PRECISION,
    "employer_lwf" DOUBLE PRECISION,
    "employee_pf" DOUBLE PRECISION,
    "employee_esi" DOUBLE PRECISION,
    "professional_tax" DOUBLE PRECISION,
    "employee_lwf" DOUBLE PRECISION,
    "payroll_finalized" BOOLEAN NOT NULL DEFAULT false,
    "finalized_date" TIMESTAMP(3),
    "final_salary" DOUBLE PRECISION,
    "tds" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "staffId" TEXT NOT NULL,

    CONSTRAINT "SalaryDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shifts" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "shiftName" TEXT NOT NULL,
    "shiftStartTime" TEXT NOT NULL,
    "shiftEndTime" TEXT NOT NULL,
    "punchInType" "PunchTime" NOT NULL DEFAULT 'ANYTIME',
    "punchOutType" "PunchTime" NOT NULL DEFAULT 'ANYTIME',
    "allowPunchInHours" INTEGER,
    "allowPunchInMinutes" INTEGER,
    "allowPunchOutMinutes" INTEGER,
    "allowPunchOutHours" INTEGER,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeekOffShift" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "weekOne" BOOLEAN DEFAULT false,
    "weekTwo" BOOLEAN DEFAULT false,
    "weekThree" BOOLEAN DEFAULT false,
    "weekFour" BOOLEAN DEFAULT false,
    "weekFive" BOOLEAN DEFAULT false,

    CONSTRAINT "WeekOffShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedShift" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "day" "Day" NOT NULL DEFAULT 'Mon',
    "weekOff" BOOLEAN NOT NULL DEFAULT false,
    "staffId" TEXT NOT NULL,
    "weekId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlexibleShift" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "dateTime" TIMESTAMP(3) NOT NULL,
    "weekOff" BOOLEAN NOT NULL DEFAULT false,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlexibleShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PunchRecords" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "punchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "punchInId" TEXT,
    "punchOutId" TEXT,
    "staffId" TEXT,
    "shiftId" TEXT,
    "status" "punchRecordStatus" NOT NULL DEFAULT 'ABSENT',

    CONSTRAINT "PunchRecords_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breakRecord" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "breakDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startBreakId" TEXT,
    "endBreakId" TEXT,
    "staffId" TEXT,

    CONSTRAINT "breakRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fine" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "lateEntryFineHoursTime" TEXT,
    "lateEntryFineAmount" DOUBLE PRECISION DEFAULT 1,
    "lateEntryAmount" DOUBLE PRECISION DEFAULT 0,
    "excessBreakFineHoursTime" TEXT,
    "excessBreakFineAmount" DOUBLE PRECISION DEFAULT 1,
    "excessBreakAmount" DOUBLE PRECISION DEFAULT 0,
    "earlyOutFineHoursTime" TEXT,
    "earlyOutFineAmount" DOUBLE PRECISION DEFAULT 1,
    "earlyOutAmount" DOUBLE PRECISION DEFAULT 0,
    "totalAmount" DOUBLE PRECISION DEFAULT 0,
    "shiftIds" TEXT,
    "punchRecordId" TEXT NOT NULL,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Overtime" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "earlyCommingEntryHoursTime" TEXT,
    "earlyCommingEntryAmount" DOUBLE PRECISION DEFAULT 1,
    "earlyEntryAmount" DOUBLE PRECISION DEFAULT 0,
    "lateOutOvertimeHoursTime" TEXT,
    "lateOutOvertimeAmount" DOUBLE PRECISION DEFAULT 1,
    "lateOutAmount" DOUBLE PRECISION DEFAULT 0,
    "totalAmount" DOUBLE PRECISION DEFAULT 0,
    "shiftIds" TEXT,
    "punchRecordId" TEXT,
    "staffId" TEXT,

    CONSTRAINT "Overtime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PunchIn" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "punchInMethod" "PunchInMethod" DEFAULT 'PHOTOCLICK',
    "punchInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "punchInDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "biometricData" TEXT,
    "qrCodeValue" TEXT,
    "photoUrl" TEXT,
    "location" TEXT,
    "approve" TEXT DEFAULT 'Pending',

    CONSTRAINT "PunchIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PunchOut" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "punchOutMethod" "PunchOutMethod" DEFAULT 'PHOTOCLICK',
    "punchOutTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "punchOutDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "biometricData" TEXT,
    "qrCodeValue" TEXT,
    "photoUrl" TEXT,
    "location" TEXT,
    "overtime" TEXT,

    CONSTRAINT "PunchOut_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StartBreak" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "breakMethod" "BreakMethod" NOT NULL DEFAULT 'PHOTOCLICK',
    "startBreakTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "biometricData" TEXT,
    "qrCodeValue" TEXT,
    "photoUrl" TEXT,
    "location" TEXT NOT NULL,

    CONSTRAINT "StartBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndBreak" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "breakMethod" "BreakMethod" NOT NULL DEFAULT 'PHOTOCLICK',
    "endBreakTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "biometricData" TEXT,
    "qrCodeValue" TEXT,
    "photoUrl" TEXT,
    "location" TEXT NOT NULL,

    CONSTRAINT "EndBreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskStatus" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "taskStatusName" TEXT NOT NULL,
    "statusColor" TEXT NOT NULL,
    "statusOrder" INTEGER NOT NULL DEFAULT 0,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "TaskStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskPriority" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "taskPriorityName" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "TaskPriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubTask" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT false,
    "time" TEXT,
    "date" TIMESTAMP(3),
    "assigneeId" TEXT,
    "taskDetailId" TEXT NOT NULL,

    CONSTRAINT "SubTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeBlock" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "status" BOOLEAN NOT NULL DEFAULT false,
    "planned" TEXT,
    "spent" TEXT,
    "date" TIMESTAMP(3),
    "assigneeId" TEXT,
    "taskDetailId" TEXT NOT NULL,

    CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDetail" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "taskName" TEXT NOT NULL,
    "taskStatusId" TEXT,
    "taskPriorityId" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "dueDate" TEXT,
    "taskDescription" TEXT,
    "departmentId" TEXT,
    "roleId" TEXT,
    "taskTag" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attachFile" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projectId" TEXT,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "TaskDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFiles" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "last_activity" TEXT,
    "total_comments" TEXT,
    "visible_to_customer" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by" TEXT NOT NULL,
    "date_uploaded" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStatus" (
    "id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "project_color" TEXT NOT NULL,
    "project_order" INTEGER NOT NULL,
    "default_filter" BOOLEAN NOT NULL DEFAULT false,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "ProjectStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPriority" (
    "id" TEXT NOT NULL,
    "Priority_name" TEXT NOT NULL,
    "Priority_color" TEXT NOT NULL,
    "Priority_order" INTEGER NOT NULL,
    "default_filter" BOOLEAN NOT NULL DEFAULT false,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "ProjectPriority_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "project_name" TEXT NOT NULL,
    "billing_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "total_rate" INTEGER NOT NULL,
    "estimated_hours" INTEGER NOT NULL,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "start_date" TEXT NOT NULL,
    "deadline" TEXT NOT NULL,
    "tags" TEXT[],
    "description" TEXT NOT NULL,
    "send_mail" BOOLEAN NOT NULL DEFAULT false,
    "customerId" TEXT,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketInformation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "subject" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "cc" TEXT NOT NULL,
    "tags" TEXT[],
    "assign_ticket" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "project" TEXT NOT NULL,
    "ticket_body" TEXT NOT NULL,
    "insert_link" TEXT NOT NULL,
    "personal_notes" TEXT NOT NULL,
    "insert_files" TEXT NOT NULL,
    "staffId" TEXT,

    CONSTRAINT "TicketInformation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "subject" TEXT,
    "description" TEXT,
    "last_activity" TEXT,
    "visible_to_customer" BOOLEAN DEFAULT false,
    "CommentId" TEXT,
    "projectId" TEXT NOT NULL,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "company" TEXT,
    "vat_number" TEXT,
    "website" TEXT,
    "groups" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currency" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "default_language" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "status" BOOLEAN DEFAULT false,
    "zip_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientNotes" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "clientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpiDetails" (
    "UpiId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,

    CONSTRAINT "UpiDetails_pkey" PRIMARY KEY ("UpiId")
);

-- CreateTable
CREATE TABLE "Deductions" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "heads" TEXT,
    "calculation" TEXT,
    "amount" DOUBLE PRECISION,
    "deduction_month" TEXT,
    "staffId" TEXT,
    "salaryDetailsId" TEXT,

    CONSTRAINT "Deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earnings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "heads" TEXT,
    "calculation" TEXT,
    "amount" DOUBLE PRECISION,
    "staffId" TEXT,
    "salary_month" TEXT,
    "salaryDetailsId" TEXT,

    CONSTRAINT "Earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentHistory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "PaymentType" NOT NULL DEFAULT 'SALARY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'SAVED',
    "transactionId" TEXT,
    "utrNumber" TEXT,
    "note" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salaryDetailsId" TEXT,

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncentiveType" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "IncentiveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incentive" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "incentiveTypeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "adminId" TEXT NOT NULL,
    "salaryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incentive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reimbursement" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "adminId" TEXT NOT NULL,
    "salaryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reimbursement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerContribution" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "calculation" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "state" TEXT,
    "includedInCTC" BOOLEAN NOT NULL DEFAULT false,
    "contribution_month" TEXT NOT NULL,
    "selected_earnings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salaryDetailsId" TEXT,

    CONSTRAINT "EmployerContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeContribution" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "calculation" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "state" TEXT,
    "contribution_month" TEXT NOT NULL,
    "selected_earnings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salaryDetailsId" TEXT,

    CONSTRAINT "EmployeeContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "position" TEXT,
    "email" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "leadValue" DOUBLE PRECISION[],
    "currencySymbol" TEXT[],
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "zipCode" TEXT,
    "defaultLanguage" TEXT[],
    "company" TEXT,
    "description" TEXT,
    "adminId" TEXT,
    "tags" TEXT[],
    "isPublic" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "message" TEXT,
    "files" TEXT[],
    "taskId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT,
    "description" TEXT,
    "status" TEXT,
    "visibleToCustmor" BOOLEAN DEFAULT false,
    "doneBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "Date" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "type" TEXT,
    "reminder" BOOLEAN DEFAULT false,
    "description" TEXT,
    "location" TEXT,
    "attachFile" TEXT[],
    "eventTypeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "colors" TEXT,
    "type" TEXT,
    "tasks" BOOLEAN DEFAULT false,
    "events" BOOLEAN DEFAULT false,

    CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "adminId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "planType" TEXT NOT NULL,
    "packageTenure" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "packageNumber" TEXT NOT NULL,
    "numberOfProjects" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "storageLimit" INTEGER NOT NULL,
    "unit" "UnitType" NOT NULL,
    "numberOfClients" INTEGER NOT NULL,
    "validityTerms" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_UserRooms" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserRooms_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_staffId" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_staffId_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_taskAssignee" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_taskAssignee_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FixedShiftToShifts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FixedShiftToShifts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FlexibleShiftToShifts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FlexibleShiftToShifts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CanBeChangedId" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CanBeChangedId_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CanBeChanged" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CanBeChanged_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectPriorityIsHidden" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectPriorityIsHidden_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CanBeChangedBy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CanBeChangedBy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProjectStaff" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProjectStaff_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_particepatsUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_particepatsUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ModuleToPackage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ModuleToPackage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDetails_userId_key" ON "AdminDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDetails_userId_key" ON "StaffDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceAutomationRule_staffId_key" ON "AttendanceAutomationRule"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceMode_staffId_key" ON "AttendanceMode"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffBackgroundVerification_staffId_key" ON "StaffBackgroundVerification"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "PastEmployment_staffId_key" ON "PastEmployment"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "BankDetails_staffId_key" ON "BankDetails"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_leavePolicyId_key" ON "LeaveBalance"("leavePolicyId");

-- CreateIndex
CREATE UNIQUE INDEX "EarlyLeavePolicy_staffId_key" ON "EarlyLeavePolicy"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "LateComingPolicy_staffId_key" ON "LateComingPolicy"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "OvertimePolicy_staffId_key" ON "OvertimePolicy"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientsPermissions_permissionsId_key" ON "ClientsPermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectsPermissions_permissionsId_key" ON "ProjectsPermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportPermissions_permissionsId_key" ON "ReportPermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffRolePermissions_permissionsId_key" ON "StaffRolePermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "SettingsPermissions_permissionsId_key" ON "SettingsPermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPermissions_permissionsId_key" ON "StaffPermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskPermissions_permissionsId_key" ON "TaskPermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "SubTaskPermissions_permissionsId_key" ON "SubTaskPermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatModulePermissions_permissionsId_key" ON "ChatModulePermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "AIPermissions_permissionsId_key" ON "AIPermissions"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_roleId_key" ON "Permissions"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "FixedShift_weekId_key" ON "FixedShift"("weekId");

-- CreateIndex
CREATE UNIQUE INDEX "FlexibleShift_staffId_dateTime_key" ON "FlexibleShift"("staffId", "dateTime");

-- CreateIndex
CREATE UNIQUE INDEX "PunchRecords_punchInId_key" ON "PunchRecords"("punchInId");

-- CreateIndex
CREATE UNIQUE INDEX "PunchRecords_punchOutId_key" ON "PunchRecords"("punchOutId");

-- CreateIndex
CREATE UNIQUE INDEX "PunchRecords_staffId_punchDate_key" ON "PunchRecords"("staffId", "punchDate");

-- CreateIndex
CREATE UNIQUE INDEX "Fine_punchRecordId_key" ON "Fine"("punchRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "Overtime_punchRecordId_key" ON "Overtime"("punchRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDetails_userId_key" ON "ClientDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDetails_vat_number_key" ON "ClientDetails"("vat_number");

-- CreateIndex
CREATE UNIQUE INDEX "UpiDetails_staffId_key" ON "UpiDetails"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Package_packageNumber_key" ON "Package"("packageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE INDEX "_UserRooms_B_index" ON "_UserRooms"("B");

-- CreateIndex
CREATE INDEX "_staffId_B_index" ON "_staffId"("B");

-- CreateIndex
CREATE INDEX "_taskAssignee_B_index" ON "_taskAssignee"("B");

-- CreateIndex
CREATE INDEX "_FixedShiftToShifts_B_index" ON "_FixedShiftToShifts"("B");

-- CreateIndex
CREATE INDEX "_FlexibleShiftToShifts_B_index" ON "_FlexibleShiftToShifts"("B");

-- CreateIndex
CREATE INDEX "_CanBeChangedId_B_index" ON "_CanBeChangedId"("B");

-- CreateIndex
CREATE INDEX "_CanBeChanged_B_index" ON "_CanBeChanged"("B");

-- CreateIndex
CREATE INDEX "_ProjectPriorityIsHidden_B_index" ON "_ProjectPriorityIsHidden"("B");

-- CreateIndex
CREATE INDEX "_CanBeChangedBy_B_index" ON "_CanBeChangedBy"("B");

-- CreateIndex
CREATE INDEX "_ProjectStaff_B_index" ON "_ProjectStaff"("B");

-- CreateIndex
CREATE INDEX "_particepatsUsers_B_index" ON "_particepatsUsers"("B");

-- CreateIndex
CREATE INDEX "_ModuleToPackage_B_index" ON "_ModuleToPackage"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkEntry" ADD CONSTRAINT "WorkEntry_staffDetailsId_fkey" FOREIGN KEY ("staffDetailsId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminDetails" ADD CONSTRAINT "AdminDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceAutomationRule" ADD CONSTRAINT "AttendanceAutomationRule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceMode" ADD CONSTRAINT "AttendanceMode_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffBackgroundVerification" ADD CONSTRAINT "StaffBackgroundVerification_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PastEmployment" ADD CONSTRAINT "PastEmployment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDetails" ADD CONSTRAINT "BankDetails_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeavePolicy" ADD CONSTRAINT "LeavePolicy_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeavePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_leavePolicyId_fkey" FOREIGN KEY ("leavePolicyId") REFERENCES "LeavePolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomDetails" ADD CONSTRAINT "CustomDetails_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EarlyLeavePolicy" ADD CONSTRAINT "EarlyLeavePolicy_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LateComingPolicy" ADD CONSTRAINT "LateComingPolicy_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimePolicy" ADD CONSTRAINT "OvertimePolicy_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientsPermissions" ADD CONSTRAINT "ClientsPermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectsPermissions" ADD CONSTRAINT "ProjectsPermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportPermissions" ADD CONSTRAINT "ReportPermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRolePermissions" ADD CONSTRAINT "StaffRolePermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingsPermissions" ADD CONSTRAINT "SettingsPermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPermissions" ADD CONSTRAINT "StaffPermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPermissions" ADD CONSTRAINT "TaskPermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTaskPermissions" ADD CONSTRAINT "SubTaskPermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatModulePermissions" ADD CONSTRAINT "ChatModulePermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIPermissions" ADD CONSTRAINT "AIPermissions_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "Permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permissions" ADD CONSTRAINT "Permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryDetails" ADD CONSTRAINT "SalaryDetails_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shifts" ADD CONSTRAINT "Shifts_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedShift" ADD CONSTRAINT "FixedShift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedShift" ADD CONSTRAINT "FixedShift_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "WeekOffShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlexibleShift" ADD CONSTRAINT "FlexibleShift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchRecords" ADD CONSTRAINT "PunchRecords_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchRecords" ADD CONSTRAINT "PunchRecords_punchInId_fkey" FOREIGN KEY ("punchInId") REFERENCES "PunchIn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchRecords" ADD CONSTRAINT "PunchRecords_punchOutId_fkey" FOREIGN KEY ("punchOutId") REFERENCES "PunchOut"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PunchRecords" ADD CONSTRAINT "PunchRecords_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breakRecord" ADD CONSTRAINT "breakRecord_endBreakId_fkey" FOREIGN KEY ("endBreakId") REFERENCES "EndBreak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breakRecord" ADD CONSTRAINT "breakRecord_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breakRecord" ADD CONSTRAINT "breakRecord_startBreakId_fkey" FOREIGN KEY ("startBreakId") REFERENCES "StartBreak"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_punchRecordId_fkey" FOREIGN KEY ("punchRecordId") REFERENCES "PunchRecords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_shiftIds_fkey" FOREIGN KEY ("shiftIds") REFERENCES "Shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Overtime" ADD CONSTRAINT "Overtime_punchRecordId_fkey" FOREIGN KEY ("punchRecordId") REFERENCES "PunchRecords"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Overtime" ADD CONSTRAINT "Overtime_shiftIds_fkey" FOREIGN KEY ("shiftIds") REFERENCES "Shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Overtime" ADD CONSTRAINT "Overtime_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatus" ADD CONSTRAINT "TaskStatus_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPriority" ADD CONSTRAINT "TaskPriority_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubTask" ADD CONSTRAINT "SubTask_taskDetailId_fkey" FOREIGN KEY ("taskDetailId") REFERENCES "TaskDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_taskDetailId_fkey" FOREIGN KEY ("taskDetailId") REFERENCES "TaskDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDetail" ADD CONSTRAINT "TaskDetail_taskStatusId_fkey" FOREIGN KEY ("taskStatusId") REFERENCES "TaskStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDetail" ADD CONSTRAINT "TaskDetail_taskPriorityId_fkey" FOREIGN KEY ("taskPriorityId") REFERENCES "TaskPriority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDetail" ADD CONSTRAINT "TaskDetail_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDetail" ADD CONSTRAINT "TaskDetail_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDetail" ADD CONSTRAINT "TaskDetail_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDetail" ADD CONSTRAINT "TaskDetail_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStatus" ADD CONSTRAINT "ProjectStatus_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPriority" ADD CONSTRAINT "ProjectPriority_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_status_fkey" FOREIGN KEY ("status") REFERENCES "ProjectStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_priority_fkey" FOREIGN KEY ("priority") REFERENCES "ProjectPriority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "ClientDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketInformation" ADD CONSTRAINT "TicketInformation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_CommentId_fkey" FOREIGN KEY ("CommentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDetails" ADD CONSTRAINT "ClientDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientNotes" ADD CONSTRAINT "ClientNotes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpiDetails" ADD CONSTRAINT "UpiDetails_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deductions" ADD CONSTRAINT "Deductions_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deductions" ADD CONSTRAINT "Deductions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earnings" ADD CONSTRAINT "Earnings_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earnings" ADD CONSTRAINT "Earnings_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncentiveType" ADD CONSTRAINT "IncentiveType_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incentive" ADD CONSTRAINT "Incentive_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incentive" ADD CONSTRAINT "Incentive_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "SalaryDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incentive" ADD CONSTRAINT "Incentive_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incentive" ADD CONSTRAINT "Incentive_incentiveTypeId_fkey" FOREIGN KEY ("incentiveTypeId") REFERENCES "IncentiveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_salaryId_fkey" FOREIGN KEY ("salaryId") REFERENCES "SalaryDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reimbursement" ADD CONSTRAINT "Reimbursement_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerContribution" ADD CONSTRAINT "EmployerContribution_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerContribution" ADD CONSTRAINT "EmployerContribution_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContribution" ADD CONSTRAINT "EmployeeContribution_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContribution" ADD CONSTRAINT "EmployeeContribution_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "TaskDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_doneBy_fkey" FOREIGN KEY ("doneBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRooms" ADD CONSTRAINT "_UserRooms_A_fkey" FOREIGN KEY ("A") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserRooms" ADD CONSTRAINT "_UserRooms_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_staffId" ADD CONSTRAINT "_staffId_A_fkey" FOREIGN KEY ("A") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_staffId" ADD CONSTRAINT "_staffId_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_taskAssignee" ADD CONSTRAINT "_taskAssignee_A_fkey" FOREIGN KEY ("A") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_taskAssignee" ADD CONSTRAINT "_taskAssignee_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FixedShiftToShifts" ADD CONSTRAINT "_FixedShiftToShifts_A_fkey" FOREIGN KEY ("A") REFERENCES "FixedShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FixedShiftToShifts" ADD CONSTRAINT "_FixedShiftToShifts_B_fkey" FOREIGN KEY ("B") REFERENCES "Shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FlexibleShiftToShifts" ADD CONSTRAINT "_FlexibleShiftToShifts_A_fkey" FOREIGN KEY ("A") REFERENCES "FlexibleShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FlexibleShiftToShifts" ADD CONSTRAINT "_FlexibleShiftToShifts_B_fkey" FOREIGN KEY ("B") REFERENCES "Shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CanBeChangedId" ADD CONSTRAINT "_CanBeChangedId_A_fkey" FOREIGN KEY ("A") REFERENCES "TaskStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CanBeChangedId" ADD CONSTRAINT "_CanBeChangedId_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CanBeChanged" ADD CONSTRAINT "_CanBeChanged_A_fkey" FOREIGN KEY ("A") REFERENCES "ProjectStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CanBeChanged" ADD CONSTRAINT "_CanBeChanged_B_fkey" FOREIGN KEY ("B") REFERENCES "ProjectStatus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectPriorityIsHidden" ADD CONSTRAINT "_ProjectPriorityIsHidden_A_fkey" FOREIGN KEY ("A") REFERENCES "ProjectPriority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectPriorityIsHidden" ADD CONSTRAINT "_ProjectPriorityIsHidden_B_fkey" FOREIGN KEY ("B") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CanBeChangedBy" ADD CONSTRAINT "_CanBeChangedBy_A_fkey" FOREIGN KEY ("A") REFERENCES "ProjectPriority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CanBeChangedBy" ADD CONSTRAINT "_CanBeChangedBy_B_fkey" FOREIGN KEY ("B") REFERENCES "ProjectPriority"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectStaff" ADD CONSTRAINT "_ProjectStaff_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectStaff" ADD CONSTRAINT "_ProjectStaff_B_fkey" FOREIGN KEY ("B") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_particepatsUsers" ADD CONSTRAINT "_particepatsUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_particepatsUsers" ADD CONSTRAINT "_particepatsUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleToPackage" ADD CONSTRAINT "_ModuleToPackage_A_fkey" FOREIGN KEY ("A") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleToPackage" ADD CONSTRAINT "_ModuleToPackage_B_fkey" FOREIGN KEY ("B") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
