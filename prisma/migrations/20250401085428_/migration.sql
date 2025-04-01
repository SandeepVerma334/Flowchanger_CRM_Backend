/*
  Warnings:

  - A unique constraint covering the columns `[clientId]` on the table `ClientDetails` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClientDetails_clientId_key" ON "ClientDetails"("clientId");
