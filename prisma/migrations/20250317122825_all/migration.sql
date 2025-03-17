/*
  Warnings:

  - You are about to drop the column `basic` on the `Earnings` table. All the data in the column will be lost.
  - You are about to drop the column `basicCalculation` on the `Earnings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Earnings` table. All the data in the column will be lost.
  - You are about to drop the column `salaryDetailId` on the `Earnings` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Earnings` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `SalaryDetail` table. All the data in the column will be lost.
  - You are about to drop the column `ctcAmount` on the `SalaryDetail` table. All the data in the column will be lost.
  - You are about to drop the column `effectiveDate` on the `SalaryDetail` table. All the data in the column will be lost.
  - You are about to drop the column `salaryStructure` on the `SalaryDetail` table. All the data in the column will be lost.
  - You are about to drop the column `salaryType` on the `SalaryDetail` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `SalaryDetail` table. All the data in the column will be lost.
  - You are about to drop the `Allowance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Compliances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Deduction` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `staffId` on table `SalaryDetail` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'SALARY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PROCESSING', 'SUCCESS', 'FAILED', 'SAVED');

-- DropForeignKey
ALTER TABLE "Allowance" DROP CONSTRAINT "Allowance_earningsId_fkey";

-- DropForeignKey
ALTER TABLE "Compliances" DROP CONSTRAINT "Compliances_salaryDetailId_fkey";

-- DropForeignKey
ALTER TABLE "Deduction" DROP CONSTRAINT "Deduction_salaryDetailId_fkey";

-- DropForeignKey
ALTER TABLE "Earnings" DROP CONSTRAINT "Earnings_salaryDetailId_fkey";

-- DropIndex
DROP INDEX "Earnings_salaryDetailId_key";

-- AlterTable
ALTER TABLE "Earnings" DROP COLUMN "basic",
DROP COLUMN "basicCalculation",
DROP COLUMN "createdAt",
DROP COLUMN "salaryDetailId",
DROP COLUMN "updatedAt",
ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "calculation" TEXT,
ADD COLUMN     "heads" TEXT,
ADD COLUMN     "salaryDetailsId" TEXT,
ADD COLUMN     "salary_month" TEXT,
ADD COLUMN     "staffId" TEXT,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- AlterTable
ALTER TABLE "SalaryDetail" DROP COLUMN "createdAt",
DROP COLUMN "ctcAmount",
DROP COLUMN "effectiveDate",
DROP COLUMN "salaryStructure",
DROP COLUMN "salaryType",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ctc_amount" DOUBLE PRECISION,
ADD COLUMN     "effective_date" TIMESTAMP(3),
ADD COLUMN     "employee_esi" DOUBLE PRECISION,
ADD COLUMN     "employee_lwf" DOUBLE PRECISION,
ADD COLUMN     "employee_pf" DOUBLE PRECISION,
ADD COLUMN     "employer_esi" DOUBLE PRECISION,
ADD COLUMN     "employer_lwf" DOUBLE PRECISION,
ADD COLUMN     "employer_pf" DOUBLE PRECISION,
ADD COLUMN     "final_salary" DOUBLE PRECISION,
ADD COLUMN     "finalized_date" TIMESTAMP(3),
ADD COLUMN     "payroll_finalized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "professional_tax" DOUBLE PRECISION,
ADD COLUMN     "salary_type" TEXT,
ADD COLUMN     "tds" DOUBLE PRECISION,
ADD COLUMN     "updated_at" TIMESTAMP(3),
ALTER COLUMN "staffId" SET NOT NULL;

-- DropTable
DROP TABLE "Allowance";

-- DropTable
DROP TABLE "Compliances";

-- DropTable
DROP TABLE "Deduction";

-- CreateTable
CREATE TABLE "EmployerContribution" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "salaryDetailsId" TEXT,
    "type" TEXT NOT NULL,
    "calculation" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "state" TEXT,
    "includedInCTC" BOOLEAN NOT NULL DEFAULT false,
    "contribution_month" TEXT NOT NULL,
    "selected_earnings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerContribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeContribution" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "salaryDetailsId" TEXT,
    "type" TEXT NOT NULL,
    "calculation" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "state" TEXT,
    "contribution_month" TEXT NOT NULL,
    "selected_earnings" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeContribution_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "PaymentHistory" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "staffId" TEXT NOT NULL,
    "salaryDetailsId" TEXT,
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

    CONSTRAINT "PaymentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployerContribution" ADD CONSTRAINT "EmployerContribution_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerContribution" ADD CONSTRAINT "EmployerContribution_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContribution" ADD CONSTRAINT "EmployeeContribution_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeContribution" ADD CONSTRAINT "EmployeeContribution_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deductions" ADD CONSTRAINT "Deductions_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deductions" ADD CONSTRAINT "Deductions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earnings" ADD CONSTRAINT "Earnings_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earnings" ADD CONSTRAINT "Earnings_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_salaryDetailsId_fkey" FOREIGN KEY ("salaryDetailsId") REFERENCES "SalaryDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
