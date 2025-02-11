-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF', 'CLIENT');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('ADMIN', 'STAFF', 'CLIENT');

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
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffDetail_mobileNumber_key" ON "StaffDetail"("mobileNumber");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDetail_officialEmail_key" ON "StaffDetail"("officialEmail");

-- CreateIndex
CREATE UNIQUE INDEX "StaffDetail_userId_key" ON "StaffDetail"("userId");

-- AddForeignKey
ALTER TABLE "StaffDetail" ADD CONSTRAINT "StaffDetail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
