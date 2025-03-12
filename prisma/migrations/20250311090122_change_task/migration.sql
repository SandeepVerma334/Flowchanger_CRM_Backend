/*
  Warnings:

  - You are about to drop the column `assignedBy` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `staffDetailsId` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_staffDetailsId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "assignedBy",
DROP COLUMN "staffDetailsId";

-- CreateTable
CREATE TABLE "_StaffDetailsToTask" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffDetailsToTask_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StaffDetailsToTask_B_index" ON "_StaffDetailsToTask"("B");

-- AddForeignKey
ALTER TABLE "_StaffDetailsToTask" ADD CONSTRAINT "_StaffDetailsToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffDetailsToTask" ADD CONSTRAINT "_StaffDetailsToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
