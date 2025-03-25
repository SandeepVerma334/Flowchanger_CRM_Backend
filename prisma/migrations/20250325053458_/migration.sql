/*
  Warnings:

  - The values [PERSENT] on the enum `AttendanceStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'PAID_LEAVE', 'HALF_DAY', 'FINE', 'OVERTIME', 'ON_BREAK', 'HOLIDAY', 'WEEK_OFF');
ALTER TABLE "AttendanceStaff" ALTER COLUMN "status" TYPE "AttendanceStatus_new" USING ("status"::text::"AttendanceStatus_new");
ALTER TYPE "AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "AttendanceStatus_old";
COMMIT;
