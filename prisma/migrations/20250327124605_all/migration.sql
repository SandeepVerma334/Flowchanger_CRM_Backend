/*
  Warnings:

  - You are about to drop the column `endBreakImage` on the `AttendanceBreakRecord` table. All the data in the column will be lost.
  - You are about to drop the column `startBreakImage` on the `AttendanceBreakRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceBreakRecord" DROP COLUMN "endBreakImage",
DROP COLUMN "startBreakImage";
