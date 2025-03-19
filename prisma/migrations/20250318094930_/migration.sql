/*
  Warnings:

  - Added the required column `adminId` to the `SalaryDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SalaryDetail" ADD COLUMN     "adminId" TEXT NOT NULL;
