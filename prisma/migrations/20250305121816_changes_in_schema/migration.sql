-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('GB', 'TB', 'MB');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'STAFF', 'CLIENT', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'REFUNDED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "mobile" TEXT,
    "profileImage" TEXT,
    "role" "UserType" NOT NULL DEFAULT 'STAFF',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "otp" INTEGER,
    "otpExpiresAt" TIMESTAMP(3),
    "adminId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Department" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "department_name" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "StaffDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "jobTitle" TEXT,
    "mobileNumber" TEXT,
    "loginOtp" INTEGER,
    "gender" TEXT,
    "officialMail" TEXT,
    "dateOfJoining" TIMESTAMP(3),
    "address" TEXT,
    "branchId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "StaffDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuperAdminDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "role" "UserType" NOT NULL DEFAULT 'SUPERADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "SuperAdminDetails_pkey" PRIMARY KEY ("id")
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
    "packageId" TEXT,
    "adminId" TEXT,
    "gender" TEXT,
    "designation" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "country" TEXT,
    "businessType" TEXT,
    "services" TEXT[],
    "companySize" TEXT,
    "role" TEXT,

    CONSTRAINT "AdminDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "group" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "defaultLanguage" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "industriesField" TEXT,
    "gstNumber" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "pinCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "addressLine" TEXT,
    "adminId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClientDetails_pkey" PRIMARY KEY ("id")
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
    "packageNumber" INTEGER,
    "numberOfProjects" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "storageLimit" INTEGER NOT NULL,
    "unit" "UnitType" NOT NULL DEFAULT 'GB',
    "numberOfClients" INTEGER NOT NULL,
    "validityTerms" TEXT[],
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "disable" BOOLEAN NOT NULL DEFAULT false,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "invoiceUrl" TEXT,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Permissions_roleId_key" ON "Permissions"("roleId");

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
CREATE UNIQUE INDEX "StaffDetails_userId_key" ON "StaffDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminDetails_email_key" ON "SuperAdminDetails"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdminDetails_userId_key" ON "SuperAdminDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminDetails_userId_key" ON "AdminDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientDetails_userId_key" ON "ClientDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_paymentId_key" ON "Transaction"("paymentId");

-- CreateIndex
CREATE INDEX "_ModuleToPackage_B_index" ON "_ModuleToPackage"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permissions" ADD CONSTRAINT "Permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuperAdminDetails" ADD CONSTRAINT "SuperAdminDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminDetails" ADD CONSTRAINT "AdminDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminDetails" ADD CONSTRAINT "AdminDetails_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDetails" ADD CONSTRAINT "ClientDetails_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientDetails" ADD CONSTRAINT "ClientDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleToPackage" ADD CONSTRAINT "_ModuleToPackage_A_fkey" FOREIGN KEY ("A") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ModuleToPackage" ADD CONSTRAINT "_ModuleToPackage_B_fkey" FOREIGN KEY ("B") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
