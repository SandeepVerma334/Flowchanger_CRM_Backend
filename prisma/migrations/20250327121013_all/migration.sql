/*
  Warnings:

  - You are about to drop the column `endBreak` on the `AttendanceBreakRecord` table. All the data in the column will be lost.
  - You are about to drop the column `startBreak` on the `AttendanceBreakRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceBreakRecord" DROP COLUMN "endBreak",
DROP COLUMN "startBreak",
ADD COLUMN     "endBreakLocation" TEXT,
ADD COLUMN     "startBreakLocation" TEXT;
