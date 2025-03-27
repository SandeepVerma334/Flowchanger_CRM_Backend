/*
  Warnings:

  - You are about to drop the column `applyFine` on the `Overtime` table. All the data in the column will be lost.
  - You are about to drop the `PunchIn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PunchOut` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PunchRecords` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[employeeId]` on the table `StaffDetails` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PunchMethod" AS ENUM ('BIOMETRIC', 'QRSCAN', 'PHOTOCLICK');

-- DropForeignKey
ALTER TABLE "PunchRecords" DROP CONSTRAINT "PunchRecords_punchInId_fkey";

-- DropForeignKey
ALTER TABLE "PunchRecords" DROP CONSTRAINT "PunchRecords_punchOutId_fkey";

-- DropForeignKey
ALTER TABLE "PunchRecords" DROP CONSTRAINT "PunchRecords_staffId_fkey";

-- AlterTable
ALTER TABLE "AttendanceStaff" ADD COLUMN     "punchInLocation" TEXT,
ADD COLUMN     "punchInMethod" "PunchMethod" DEFAULT 'PHOTOCLICK',
ADD COLUMN     "punchInPhoto" TEXT,
ADD COLUMN     "punchOutLocation" TEXT,
ADD COLUMN     "punchOutMethod" "PunchMethod" DEFAULT 'PHOTOCLICK',
ADD COLUMN     "punchOutPhoto" TEXT;

-- AlterTable
ALTER TABLE "Overtime" DROP COLUMN "applyFine";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roomId" TEXT;

-- DropTable
DROP TABLE "PunchIn";

-- DropTable
DROP TABLE "PunchOut";

-- DropTable
DROP TABLE "PunchRecords";

-- DropEnum
DROP TYPE "PunchInMethod";

-- DropEnum
DROP TYPE "PunchOutMethod";

-- DropEnum
DROP TYPE "punchRecordStatus";

-- CreateTable
CREATE TABLE "ProjectGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "senderId" TEXT,
    "reciverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectGroupId" TEXT,
    "userId" TEXT,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffDetails_employeeId_key" ON "StaffDetails"("employeeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ProjectGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGroup" ADD CONSTRAINT "ProjectGroup_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_reciverId_fkey" FOREIGN KEY ("reciverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_projectGroupId_fkey" FOREIGN KEY ("projectGroupId") REFERENCES "ProjectGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
