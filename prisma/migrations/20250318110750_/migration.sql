-- DropForeignKey
ALTER TABLE "Branch" DROP CONSTRAINT "Branch_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Department" DROP CONSTRAINT "Department_adminId_fkey";

-- DropForeignKey
ALTER TABLE "Role" DROP CONSTRAINT "Role_adminId_fkey";

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
