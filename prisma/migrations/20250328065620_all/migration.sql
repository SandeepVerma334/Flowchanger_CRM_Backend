/*
  Warnings:

  - You are about to drop the column `startbreakPhoto` on the `AttendanceBreakRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceBreakRecord" DROP COLUMN "startbreakPhoto",
ADD COLUMN     "startBreakPhoto" TEXT;
