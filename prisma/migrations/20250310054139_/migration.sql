/*
  Warnings:

  - You are about to drop the column `contactNotifications` on the `ProjectPermissions` table. All the data in the column will be lost.
  - You are about to drop the column `visibleTabs` on the `ProjectPermissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "contactNotifications" TEXT[],
ADD COLUMN     "visibleTabs" TEXT[];

-- AlterTable
ALTER TABLE "ProjectPermissions" DROP COLUMN "contactNotifications",
DROP COLUMN "visibleTabs";
