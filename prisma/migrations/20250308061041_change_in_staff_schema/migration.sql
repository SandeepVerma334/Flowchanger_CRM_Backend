/*
  Warnings:

  - You are about to drop the column `adminId` on the `StaffDetails` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StaffDetails" DROP CONSTRAINT "StaffDetails_adminId_fkey";

-- AlterTable
ALTER TABLE "StaffDetails" DROP COLUMN "adminId";
