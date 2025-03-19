/*
  Warnings:

  - Added the required column `adminId` to the `AttendanceBreakRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AttendanceBreakRecord" ADD COLUMN     "adminId" TEXT NOT NULL;
