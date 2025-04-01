/*
  Warnings:

  - You are about to drop the column `endBreak` on the `AttendanceBreakRecord` table. All the data in the column will be lost.
  - You are about to drop the column `endBreakImage` on the `AttendanceBreakRecord` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `AttendanceBreakRecord` table. All the data in the column will be lost.
  - You are about to drop the column `startBreak` on the `AttendanceBreakRecord` table. All the data in the column will be lost.
  - You are about to drop the column `startBreakImage` on the `AttendanceBreakRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AttendanceBreakRecord" DROP COLUMN "endBreak",
DROP COLUMN "endBreakImage",
DROP COLUMN "location",
DROP COLUMN "startBreak",
DROP COLUMN "startBreakImage",
ADD COLUMN     "endBreakDate" TEXT,
ADD COLUMN     "endBreakLocation" TEXT,
ADD COLUMN     "endBreakPhoto" TEXT,
ADD COLUMN     "endBreakTime" TEXT,
ADD COLUMN     "startBreakDate" TEXT,
ADD COLUMN     "startBreakLocation" TEXT,
ADD COLUMN     "startBreakPhoto" TEXT,
ADD COLUMN     "startBreakTime" TEXT;
