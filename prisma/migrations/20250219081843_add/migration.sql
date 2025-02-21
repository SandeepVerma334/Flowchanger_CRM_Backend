/*
  Warnings:

  - Added the required column `address` to the `AdminDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `adminId` to the `AdminDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `AdminDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `AdminDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `designation` to the `AdminDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `AdminDetails` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipCode` to the `AdminDetails` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdminDetails" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "adminId" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "designation" TEXT NOT NULL,
ADD COLUMN     "state" TEXT NOT NULL,
ADD COLUMN     "zipCode" TEXT NOT NULL;
