-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
