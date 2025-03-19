/*
  Warnings:

  - Added the required column `adminId` to the `FinancialDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "FinancialDetails" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "adminId" TEXT NOT NULL;
