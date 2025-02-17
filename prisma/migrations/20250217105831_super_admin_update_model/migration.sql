-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'SALARY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED', 'SAVED');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'STAFF', 'CLIENT', 'SUPERADMIN');

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
CREATE TABLE "StaffDetail" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "loginOtp" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "dateOfJoining" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "StaffDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "superAdminDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserType" NOT NULL DEFAULT 'SUPERADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "superAdminDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "UserType" NOT NULL DEFAULT 'STAFF',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffDetail_mobileNumber_key" ON "StaffDetail"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDetail_officialEmail_key" ON "StaffDetail"("officialEmail");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDetail_userId_key" ON "StaffDetail"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "superAdminDetails_email_key" ON "superAdminDetails"("email");

-- AddForeignKey
ALTER TABLE "StaffDetail" ADD CONSTRAINT "StaffDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
