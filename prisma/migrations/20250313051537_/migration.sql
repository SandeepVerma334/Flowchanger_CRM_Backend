/*
  Warnings:

  - You are about to drop the column `departmentId` on the `StaffEducationQualification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StaffEducationQualification" DROP CONSTRAINT "StaffEducationQualification_departmentId_fkey";

-- AlterTable
ALTER TABLE "StaffEducationQualification" DROP COLUMN "departmentId",
ADD COLUMN     "department" TEXT,
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "StaffEducationQualification" ADD CONSTRAINT "StaffEducationQualification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
