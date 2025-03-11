/*
  Warnings:

  - The `projectId` column on the `StaffDetails` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "StaffDetails" DROP CONSTRAINT "StaffDetails_projectId_fkey";

-- AlterTable
ALTER TABLE "StaffDetails" DROP COLUMN "projectId",
ADD COLUMN     "projectId" TEXT[];

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
