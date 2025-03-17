-- AlterTable
ALTER TABLE "AttendanceStaff" ADD COLUMN     "adminId" TEXT;

-- AddForeignKey
ALTER TABLE "AttendanceStaff" ADD CONSTRAINT "AttendanceStaff_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
