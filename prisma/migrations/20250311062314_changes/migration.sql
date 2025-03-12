/*
  Warnings:

  - You are about to drop the column `customer` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_customer_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "customer";

-- CreateTable
CREATE TABLE "_ClientDetailsToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClientDetailsToProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ClientDetailsToProject_B_index" ON "_ClientDetailsToProject"("B");

-- AddForeignKey
ALTER TABLE "_ClientDetailsToProject" ADD CONSTRAINT "_ClientDetailsToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "ClientDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientDetailsToProject" ADD CONSTRAINT "_ClientDetailsToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
