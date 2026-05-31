/*
  Warnings:

  - You are about to drop the `CompanyReturn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompanyReturnItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomerReturn` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomerReturnItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Delivery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `quantity` on the `Batch` table. All the data in the column will be lost.
  - You are about to alter the column `expiryDate` on the `Batch` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to drop the column `ledgerBalance` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `PurchaseInvoice` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PurchaseInvoice` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `PurchaseInvoice` table. All the data in the column will be lost.
  - You are about to alter the column `invoiceDate` on the `PurchaseInvoice` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to drop the column `batchNumber` on the `PurchaseInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `PurchaseInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `PurchaseInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `expiryDate` on the `PurchaseInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `genericName` on the `PurchaseInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `medicineName` on the `PurchaseInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `saleDist` on the `PurchaseInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `saleRetail` on the `PurchaseInvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `SalesInvoice` table. All the data in the column will be lost.
  - You are about to alter the column `invoiceDate` on the `SalesInvoice` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - You are about to drop the column `area` on the `Salesman` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Salesman` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Salesman` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Salesman` table. All the data in the column will be lost.
  - You are about to alter the column `isActive` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - Added the required column `branchId` to the `PurchaseInvoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `supplierId` on table `PurchaseInvoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `batchId` on table `PurchaseInvoiceItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `productId` on table `PurchaseInvoiceItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `branchId` to the `SalesInvoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `customerId` on table `SalesInvoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `warehouseId` on table `SalesInvoice` required. This step will fail if there are existing NULL values in that column.
  - Made the column `batchId` on table `SalesInvoiceItem` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `employeeId` to the `Salesman` table without a default value. This is not possible if the table is not empty.
  - Made the column `batchId` on table `Stock` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyId` on table `Supplier` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `branchId` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CompanyReturn_returnNumber_key";

-- DropIndex
DROP INDEX "CustomerReturn_returnNumber_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CompanyReturn";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CompanyReturnItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CustomerReturn";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CustomerReturnItem";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Delivery";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Branch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "branchId" INTEGER NOT NULL,
    "userId" INTEGER,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "baseSalary" REAL NOT NULL DEFAULT 0,
    "joinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "punchIn" DATETIME,
    "punchOut" DATETIME,
    "markedBy" INTEGER,
    "notes" TEXT,
    CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attendance_markedBy_fkey" FOREIGN KEY ("markedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalarySlip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "baseSalary" REAL NOT NULL,
    "deductions" REAL NOT NULL DEFAULT 0,
    "bonuses" REAL NOT NULL DEFAULT 0,
    "netSalary" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "paidDate" DATETIME,
    CONSTRAINT "SalarySlip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Area" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "CustomerLedgerEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "balance" REAL NOT NULL,
    CONSTRAINT "CustomerLedgerEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierLedgerEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplierId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "balance" REAL NOT NULL,
    CONSTRAINT "SupplierLedgerEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "branchId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "customerId" INTEGER,
    "supplierId" INTEGER,
    "invoiceNumber" TEXT,
    CONSTRAINT "Payment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "useApi" BOOLEAN NOT NULL DEFAULT true,
    "apiUrl" TEXT,
    "excelPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" DATETIME,
    "purchasePrice" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Batch" ("batchNumber", "createdAt", "expiryDate", "id", "productId", "purchasePrice") SELECT "batchNumber", "createdAt", "expiryDate", "id", "productId", "purchasePrice" FROM "Batch";
DROP TABLE "Batch";
ALTER TABLE "new_Batch" RENAME TO "Batch";
CREATE UNIQUE INDEX "Batch_productId_batchNumber_key" ON "Batch"("productId", "batchNumber");
CREATE TABLE "new_Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "areaId" INTEGER,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'retail',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Customer_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "createdAt", "creditLimit", "id", "name", "phone", "type") SELECT "address", "createdAt", "creditLimit", "id", "name", "phone", "type" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE TABLE "new_PurchaseInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "branchId" INTEGER NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "notes" TEXT,
    CONSTRAINT "PurchaseInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseInvoice" ("discount", "id", "invoiceDate", "invoiceNumber", "netAmount", "notes", "status", "supplierId", "totalAmount", "warehouseId") SELECT "discount", "id", coalesce("invoiceDate", CURRENT_TIMESTAMP) AS "invoiceDate", "invoiceNumber", "netAmount", "notes", "status", "supplierId", "totalAmount", "warehouseId" FROM "PurchaseInvoice";
DROP TABLE "PurchaseInvoice";
ALTER TABLE "new_PurchaseInvoice" RENAME TO "PurchaseInvoice";
CREATE UNIQUE INDEX "PurchaseInvoice_invoiceNumber_key" ON "PurchaseInvoice"("invoiceNumber");
CREATE TABLE "new_PurchaseInvoiceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PurchaseInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoiceItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseInvoiceItem" ("batchId", "bonus", "id", "invoiceId", "productId", "purchasePrice", "quantity", "subtotal") SELECT "batchId", "bonus", "id", "invoiceId", "productId", "purchasePrice", "quantity", "subtotal" FROM "PurchaseInvoiceItem";
DROP TABLE "PurchaseInvoiceItem";
ALTER TABLE "new_PurchaseInvoiceItem" RENAME TO "PurchaseInvoiceItem";
CREATE TABLE "new_SalesInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "branchId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "salesmanId" INTEGER,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "saleType" TEXT NOT NULL DEFAULT 'retail',
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    CONSTRAINT "SalesInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_salesmanId_fkey" FOREIGN KEY ("salesmanId") REFERENCES "Salesman" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalesInvoice" ("customerId", "discount", "id", "invoiceDate", "invoiceNumber", "saleType", "salesmanId", "status", "totalAmount", "warehouseId") SELECT "customerId", "discount", "id", "invoiceDate", "invoiceNumber", "saleType", "salesmanId", "status", "totalAmount", "warehouseId" FROM "SalesInvoice";
DROP TABLE "SalesInvoice";
ALTER TABLE "new_SalesInvoice" RENAME TO "SalesInvoice";
CREATE UNIQUE INDEX "SalesInvoice_invoiceNumber_key" ON "SalesInvoice"("invoiceNumber");
CREATE TABLE "new_SalesInvoiceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "salePrice" REAL NOT NULL,
    "purchasePrice" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "SalesInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoiceItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SalesInvoiceItem" ("batchId", "id", "invoiceId", "productId", "purchasePrice", "quantity", "salePrice") SELECT "batchId", "id", "invoiceId", "productId", "purchasePrice", "quantity", "salePrice" FROM "SalesInvoiceItem";
DROP TABLE "SalesInvoiceItem";
ALTER TABLE "new_SalesInvoiceItem" RENAME TO "SalesInvoiceItem";
CREATE TABLE "new_Salesman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "areaId" INTEGER,
    "commissionRate" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Salesman_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Salesman_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Salesman" ("id") SELECT "id" FROM "Salesman";
DROP TABLE "Salesman";
ALTER TABLE "new_Salesman" RENAME TO "Salesman";
CREATE UNIQUE INDEX "Salesman_employeeId_key" ON "Salesman"("employeeId");
CREATE TABLE "new_Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stock" ("batchId", "id", "productId", "quantity", "warehouseId") SELECT "batchId", "id", "productId", "quantity", "warehouseId" FROM "Stock";
DROP TABLE "Stock";
ALTER TABLE "new_Stock" RENAME TO "Stock";
CREATE UNIQUE INDEX "Stock_warehouseId_productId_batchId_key" ON "Stock"("warehouseId", "productId", "batchId");
CREATE TABLE "new_Supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    CONSTRAINT "Supplier_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Supplier" ("address", "companyId", "id", "name", "phone") SELECT "address", "companyId", "id", "name", "phone" FROM "Supplier";
DROP TABLE "Supplier";
ALTER TABLE "new_Supplier" RENAME TO "Supplier";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'cashier',
    "fullName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_User" ("fullName", "id", "isActive", "passwordHash", "role", "username") SELECT "fullName", "id", "isActive", "passwordHash", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE TABLE "new_Warehouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "branchId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Warehouse_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Warehouse" ("description", "id", "name", "type") SELECT "description", "id", "name", "type" FROM "Warehouse";
DROP TABLE "Warehouse";
ALTER TABLE "new_Warehouse" RENAME TO "Warehouse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalarySlip_employeeId_month_key" ON "SalarySlip"("employeeId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Area_name_key" ON "Area"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_companyId_key" ON "Settings"("companyId");
