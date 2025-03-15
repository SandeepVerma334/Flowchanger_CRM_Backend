/*
  Warnings:

  - You are about to drop the column `department` on the `StaffEducationQualification` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StaffEducationQualification" DROP CONSTRAINT "StaffEducationQualification_department_fkey";

-- AlterTable
ALTER TABLE "StaffEducationQualification" DROP COLUMN "department",
ADD COLUMN     "departmentId" TEXT;

-- AddForeignKey
ALTER TABLE "StaffEducationQualification" ADD CONSTRAINT "StaffEducationQualification_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
