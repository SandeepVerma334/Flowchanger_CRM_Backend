/*
  Warnings:

  - You are about to drop the column `permissions` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `projectsPermissionsId` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_projectsPermissionsId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "permissions",
DROP COLUMN "projectsPermissionsId";

-- DropEnum
DROP TYPE "ProjectPermissions";

-- CreateTable
CREATE TABLE "ProjectPermissions" (
    "id" TEXT NOT NULL,
    "allowCustomerToViewTasks" BOOLEAN,
    "allowCustomerToCreateTasks" BOOLEAN,
    "allowCustomerToEditTasks" BOOLEAN,
    "allowCustomerToCommentOnProjectTasks" BOOLEAN,
    "allowCustomerToViewTaskComments" BOOLEAN,
    "allowCustomerToViewTaskAttachments" BOOLEAN,
    "allowCustomerToViewTaskChecklistItems" BOOLEAN,
    "allowCustomerToUploadAttachmentsOnTasks" BOOLEAN,
    "allowCustomerToViewTaskTotalLoggedTime" BOOLEAN,
    "allowCustomerToViewFinanceOverview" BOOLEAN,
    "allowCustomerToUploadFiles" BOOLEAN,
    "allowCustomerToOpenDiscussions" BOOLEAN,
    "allowCustomerToViewMilestones" BOOLEAN,
    "allowCustomerToViewGantt" BOOLEAN,
    "allowCustomerToViewTimesheets" BOOLEAN,
    "allowCustomerToViewActivityLog" BOOLEAN,
    "allowCustomerToViewTeamMembers" BOOLEAN,

    CONSTRAINT "ProjectPermissions_pkey" PRIMARY KEY ("id")
);
