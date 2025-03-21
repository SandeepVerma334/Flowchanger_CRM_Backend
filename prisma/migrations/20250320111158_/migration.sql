-- AlterTable
ALTER TABLE "AdminDetails" ADD COLUMN     "officeEndtime" TEXT,
ADD COLUMN     "officeStartTime" TEXT,
ADD COLUMN     "officeWorkinghours" TEXT NOT NULL DEFAULT '8';

-- AlterTable
ALTER TABLE "AttendanceStaff" ADD COLUMN     "officeWorkingHours" TEXT;
