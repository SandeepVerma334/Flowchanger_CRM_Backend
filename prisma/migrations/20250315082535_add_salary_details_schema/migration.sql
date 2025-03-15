-- CreateTable
CREATE TABLE "SalaryDetail" (
    "id" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "salaryType" TEXT NOT NULL,
    "salaryStructure" TEXT NOT NULL,
    "ctcAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Earnings" (
    "id" TEXT NOT NULL,
    "salaryDetailId" TEXT NOT NULL,
    "basic" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allowance" (
    "id" TEXT NOT NULL,
    "earningsId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allowance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compliances" (
    "id" TEXT NOT NULL,
    "salaryDetailId" TEXT NOT NULL,
    "employerPF" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "pfEdliAdmin" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "employerESI" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "employerLWF" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "employeePF" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "employeeESI" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "professionalTax" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "employeeLWF" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Compliances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deduction" (
    "id" TEXT NOT NULL,
    "salaryDetailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deduction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Earnings_salaryDetailId_key" ON "Earnings"("salaryDetailId");

-- CreateIndex
CREATE UNIQUE INDEX "Compliances_salaryDetailId_key" ON "Compliances"("salaryDetailId");

-- AddForeignKey
ALTER TABLE "SalaryDetail" ADD CONSTRAINT "SalaryDetail_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Earnings" ADD CONSTRAINT "Earnings_salaryDetailId_fkey" FOREIGN KEY ("salaryDetailId") REFERENCES "SalaryDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allowance" ADD CONSTRAINT "Allowance_earningsId_fkey" FOREIGN KEY ("earningsId") REFERENCES "Earnings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compliances" ADD CONSTRAINT "Compliances_salaryDetailId_fkey" FOREIGN KEY ("salaryDetailId") REFERENCES "SalaryDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deduction" ADD CONSTRAINT "Deduction_salaryDetailId_fkey" FOREIGN KEY ("salaryDetailId") REFERENCES "SalaryDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
