/*
  Warnings:

  - You are about to drop the column `endbreakPhoto` on the `AttendanceBreakRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceBreakRecord" DROP COLUMN "endbreakPhoto",
ADD COLUMN     "endBreakPhoto" TEXT;
