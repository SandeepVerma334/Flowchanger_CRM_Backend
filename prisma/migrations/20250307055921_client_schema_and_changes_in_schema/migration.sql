/*
  Warnings:

  - You are about to drop the column `profileImage` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AIPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Branch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChatModulePermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClientsPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Department` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectsPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReportPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SettingsPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StaffRolePermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubTaskPermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TaskPermissions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AIPermissions" DROP CONSTRAINT "AIPermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Branch" DROP CONSTRAINT "Branch_adminId_fkey";

-- DropForeignKey
ALTER TABLE "ChatModulePermissions" DROP CONSTRAINT "ChatModulePermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "ClientsPermissions" DROP CONSTRAINT "ClientsPermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Permissions" DROP CONSTRAINT "Permissions_roleId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectsPermissions" DROP CONSTRAINT "ProjectsPermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "ReportPermissions" DROP CONSTRAINT "ReportPermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_adminId_fkey";

-- DropForeignKey
ALTER TABLE "SettingsPermissions" DROP CONSTRAINT "SettingsPermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "StaffDetails" DROP CONSTRAINT "StaffDetails_branchId_fkey";

-- DropForeignKey
ALTER TABLE "StaffDetails" DROP CONSTRAINT "StaffDetails_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "StaffDetails" DROP CONSTRAINT "StaffDetails_roleId_fkey";

-- DropForeignKey
ALTER TABLE "StaffDetails" DROP CONSTRAINT "StaffDetails_userId_fkey";

-- DropForeignKey
ALTER TABLE "StaffPermissions" DROP CONSTRAINT "StaffPermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "StaffRolePermissions" DROP CONSTRAINT "StaffRolePermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "SubTaskPermissions" DROP CONSTRAINT "SubTaskPermissions_permissionsId_fkey";

-- DropForeignKey
ALTER TABLE "TaskPermissions" DROP CONSTRAINT "TaskPermissions_permissionsId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImage";

-- DropTable
DROP TABLE "AIPermissions";

-- DropTable
DROP TABLE "Branch";

-- DropTable
DROP TABLE "ChatModulePermissions";

-- DropTable
DROP TABLE "ClientsPermissions";

-- DropTable
DROP TABLE "Department";

-- DropTable
DROP TABLE "Permissions";

-- DropTable
DROP TABLE "ProjectsPermissions";

-- DropTable
DROP TABLE "ReportPermissions";

-- DropTable
DROP TABLE "Role";

-- DropTable
DROP TABLE "SettingsPermissions";

-- DropTable
DROP TABLE "StaffDetails";

-- DropTable
DROP TABLE "StaffPermissions";

-- DropTable
DROP TABLE "StaffRolePermissions";

-- DropTable
DROP TABLE "SubTaskPermissions";

-- DropTable
DROP TABLE "TaskPermissions";
