-- AlterTable
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateTable
CREATE TABLE "StaffEducationQualification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "instituteName" TEXT,
    "department" TEXT,
    "course" TEXT,
    "location" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "discription" TEXT,
    "staffId" TEXT,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffEducationQualification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StaffEducationQualification" ADD CONSTRAINT "StaffEducationQualification_department_fkey" FOREIGN KEY ("department") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffEducationQualification" ADD CONSTRAINT "StaffEducationQualification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffEducationQualification" ADD CONSTRAINT "StaffEducationQualification_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
