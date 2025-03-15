-- AlterTable
ALTER TABLE "StaffDetails" ADD COLUMN     "birthCertificate" TEXT,
ADD COLUMN     "cityOfresidence" TEXT,
ADD COLUMN     "degreeCertificate" TEXT,
ADD COLUMN     "guarantorForm" TEXT,
ADD COLUMN     "offerLetter" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobile2" TEXT;
