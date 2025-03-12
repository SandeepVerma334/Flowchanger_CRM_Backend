/*
  Warnings:

  - You are about to drop the column `attachFile` on the `Discussion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Discussion" DROP COLUMN "attachFile",
ADD COLUMN     "attachFiles" TEXT[];
