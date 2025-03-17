-- DropForeignKey
ALTER TABLE "AdminDetails" DROP CONSTRAINT "AdminDetails_userId_fkey";

-- AddForeignKey
ALTER TABLE "AdminDetails" ADD CONSTRAINT "AdminDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
