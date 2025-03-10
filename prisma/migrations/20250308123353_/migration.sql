/*
  Warnings:

  - Added the required column `customer` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deadline` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectName` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "customer" VARCHAR(255) NOT NULL,
ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "estimatedHours" INTEGER,
ADD COLUMN     "progressBar" INTEGER,
ADD COLUMN     "projectName" VARCHAR(255) NOT NULL,
ADD COLUMN     "projectsPermissionsId" TEXT,
ADD COLUMN     "sendMail" BOOLEAN,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "StaffDetails" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "ProjectPermissions" (
    "id" TEXT NOT NULL,
    "contactNotifications" TEXT[],
    "visibleTabs" TEXT[],
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
    "projectId" TEXT,

    CONSTRAINT "ProjectPermissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "StaffDetails" ADD CONSTRAINT "StaffDetails_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectsPermissionsId_fkey" FOREIGN KEY ("projectsPermissionsId") REFERENCES "ProjectsPermissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPermissions" ADD CONSTRAINT "ProjectPermissions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
