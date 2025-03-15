-- CreateTable
CREATE TABLE "FinancialDetails" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "ifscCode" TEXT,
    "branchName" TEXT,
    "pinCode" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "staffId" TEXT,

    CONSTRAINT "FinancialDetails_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FinancialDetails" ADD CONSTRAINT "FinancialDetails_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
