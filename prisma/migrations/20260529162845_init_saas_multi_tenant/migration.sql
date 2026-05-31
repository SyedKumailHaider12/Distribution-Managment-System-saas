/*
  Warnings:

  - You are about to drop the `Company` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `companyId` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Brand` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `companyId` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `branchId` on the `Warehouse` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `Area` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `AuditLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Branch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `CustomerLedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Employee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PurchaseInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `PurchaseInvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `SalesInvoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `SalesInvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Salesman` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Stock` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `SupplierLedgerEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `Warehouse` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Company";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Organization" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Area" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Area_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Area" ("description", "id", "name") SELECT "description", "id", "name" FROM "Area";
DROP TABLE "Area";
ALTER TABLE "new_Area" RENAME TO "Area";
CREATE TABLE "new_AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "tableName" TEXT,
    "recordId" INTEGER,
    "details" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditLog" ("action", "details", "id", "recordId", "tableName", "timestamp", "userId") SELECT "action", "details", "id", "recordId", "tableName", "timestamp", "userId" FROM "AuditLog";
DROP TABLE "AuditLog";
ALTER TABLE "new_AuditLog" RENAME TO "AuditLog";
CREATE TABLE "new_Batch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "expiryDate" DATETIME,
    "purchasePrice" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Batch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Batch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Batch" ("batchNumber", "createdAt", "expiryDate", "id", "productId", "purchasePrice") SELECT "batchNumber", "createdAt", "expiryDate", "id", "productId", "purchasePrice" FROM "Batch";
DROP TABLE "Batch";
ALTER TABLE "new_Batch" RENAME TO "Batch";
CREATE UNIQUE INDEX "Batch_organizationId_productId_batchNumber_key" ON "Batch"("organizationId", "productId", "batchNumber");
CREATE TABLE "new_Branch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Branch" ("address", "createdAt", "id", "isActive", "name", "phone") SELECT "address", "createdAt", "id", "isActive", "name", "phone" FROM "Branch";
DROP TABLE "Branch";
ALTER TABLE "new_Branch" RENAME TO "Branch";
CREATE TABLE "new_Brand" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Brand_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Brand" ("createdAt", "description", "id", "name") SELECT "createdAt", "description", "id", "name" FROM "Brand";
DROP TABLE "Brand";
ALTER TABLE "new_Brand" RENAME TO "Brand";
CREATE TABLE "new_Category" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Category_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Category" ("description", "id", "name") SELECT "description", "id", "name" FROM "Category";
DROP TABLE "Category";
ALTER TABLE "new_Category" RENAME TO "Category";
CREATE TABLE "new_Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "areaId" INTEGER,
    "creditLimit" REAL NOT NULL DEFAULT 0,
    "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'retail',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Customer_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "areaId", "createdAt", "creditLimit", "id", "isWalkIn", "name", "phone", "type") SELECT "address", "areaId", "createdAt", "creditLimit", "id", "isWalkIn", "name", "phone", "type" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE TABLE "new_CustomerLedgerEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "customerId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "balance" REAL NOT NULL,
    CONSTRAINT "CustomerLedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CustomerLedgerEntry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CustomerLedgerEntry" ("amount", "balance", "customerId", "date", "description", "id", "referenceId", "type") SELECT "amount", "balance", "customerId", "date", "description", "id", "referenceId", "type" FROM "CustomerLedgerEntry";
DROP TABLE "CustomerLedgerEntry";
ALTER TABLE "new_CustomerLedgerEntry" RENAME TO "CustomerLedgerEntry";
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "userId" INTEGER,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT,
    "baseSalary" REAL NOT NULL DEFAULT 0,
    "joinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Employee_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Employee_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Employee" ("baseSalary", "branchId", "employeeCode", "id", "isActive", "joinDate", "name", "phone", "role", "userId") SELECT "baseSalary", "branchId", "employeeCode", "id", "isActive", "joinDate", "name", "phone", "role", "userId" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");
CREATE UNIQUE INDEX "Employee_employeeCode_key" ON "Employee"("employeeCode");
CREATE TABLE "new_Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
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
    CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "branchId", "customerId", "date", "id", "invoiceNumber", "notes", "paymentMethod", "referenceNumber", "supplierId", "type") SELECT "amount", "branchId", "customerId", "date", "id", "invoiceNumber", "notes", "paymentMethod", "referenceNumber", "supplierId", "type" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "brandId" INTEGER,
    "categoryId" INTEGER,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "barcode" TEXT,
    "purchasePrice" REAL NOT NULL DEFAULT 0,
    "salePriceRetail" REAL NOT NULL DEFAULT 0,
    "salePriceDistribution" REAL NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("barcode", "brandId", "categoryId", "createdAt", "id", "name", "purchasePrice", "reorderLevel", "salePriceDistribution", "salePriceRetail", "unit") SELECT "barcode", "brandId", "categoryId", "createdAt", "id", "name", "purchasePrice", "reorderLevel", "salePriceDistribution", "salePriceRetail", "unit" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_organizationId_barcode_key" ON "Product"("organizationId", "barcode");
CREATE TABLE "new_PurchaseInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "supplierPhone" TEXT,
    "warehouseId" INTEGER NOT NULL,
    "invoiceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "netAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "notes" TEXT,
    CONSTRAINT "PurchaseInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoice_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseInvoice" ("branchId", "discount", "id", "invoiceDate", "invoiceNumber", "netAmount", "notes", "status", "supplierId", "totalAmount", "warehouseId") SELECT "branchId", "discount", "id", "invoiceDate", "invoiceNumber", "netAmount", "notes", "status", "supplierId", "totalAmount", "warehouseId" FROM "PurchaseInvoice";
DROP TABLE "PurchaseInvoice";
ALTER TABLE "new_PurchaseInvoice" RENAME TO "PurchaseInvoice";
CREATE UNIQUE INDEX "PurchaseInvoice_organizationId_invoiceNumber_key" ON "PurchaseInvoice"("organizationId", "invoiceNumber");
CREATE TABLE "new_PurchaseInvoiceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "purchasePrice" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PurchaseInvoiceItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PurchaseInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseInvoiceItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseInvoiceItem" ("batchId", "bonus", "id", "invoiceId", "productId", "purchasePrice", "quantity", "subtotal") SELECT "batchId", "bonus", "id", "invoiceId", "productId", "purchasePrice", "quantity", "subtotal" FROM "PurchaseInvoiceItem";
DROP TABLE "PurchaseInvoiceItem";
ALTER TABLE "new_PurchaseInvoiceItem" RENAME TO "PurchaseInvoiceItem";
CREATE TABLE "new_SalesInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
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
    CONSTRAINT "SalesInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoice_salesmanId_fkey" FOREIGN KEY ("salesmanId") REFERENCES "Salesman" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SalesInvoice" ("branchId", "customerId", "discount", "id", "invoiceDate", "invoiceNumber", "netAmount", "saleType", "salesmanId", "status", "totalAmount", "warehouseId") SELECT "branchId", "customerId", "discount", "id", "invoiceDate", "invoiceNumber", "netAmount", "saleType", "salesmanId", "status", "totalAmount", "warehouseId" FROM "SalesInvoice";
DROP TABLE "SalesInvoice";
ALTER TABLE "new_SalesInvoice" RENAME TO "SalesInvoice";
CREATE UNIQUE INDEX "SalesInvoice_organizationId_invoiceNumber_key" ON "SalesInvoice"("organizationId", "invoiceNumber");
CREATE TABLE "new_SalesInvoiceItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "salePrice" REAL NOT NULL,
    "purchasePrice" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "SalesInvoiceItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesInvoiceItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_SalesInvoiceItem" ("batchId", "id", "invoiceId", "productId", "purchasePrice", "quantity", "salePrice", "subtotal") SELECT "batchId", "id", "invoiceId", "productId", "purchasePrice", "quantity", "salePrice", "subtotal" FROM "SalesInvoiceItem";
DROP TABLE "SalesInvoiceItem";
ALTER TABLE "new_SalesInvoiceItem" RENAME TO "SalesInvoiceItem";
CREATE TABLE "new_Salesman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "areaId" INTEGER,
    "commissionRate" REAL NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "target" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Salesman_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Salesman_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Salesman_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Salesman" ("areaId", "commissionRate", "createdAt", "employeeId", "id", "name", "phone", "target") SELECT "areaId", "commissionRate", "createdAt", "employeeId", "id", "name", "phone", "target" FROM "Salesman";
DROP TABLE "Salesman";
ALTER TABLE "new_Salesman" RENAME TO "Salesman";
CREATE UNIQUE INDEX "Salesman_employeeId_key" ON "Salesman"("employeeId");
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "useApi" BOOLEAN NOT NULL DEFAULT true,
    "apiUrl" TEXT,
    "excelPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Settings" ("apiUrl", "createdAt", "excelPath", "id", "useApi") SELECT "apiUrl", "createdAt", "excelPath", "id", "useApi" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
CREATE UNIQUE INDEX "Settings_organizationId_key" ON "Settings"("organizationId");
CREATE TABLE "new_Stock" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "batchId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Stock_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Stock_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stock" ("batchId", "id", "productId", "quantity", "warehouseId") SELECT "batchId", "id", "productId", "quantity", "warehouseId" FROM "Stock";
DROP TABLE "Stock";
ALTER TABLE "new_Stock" RENAME TO "Stock";
CREATE UNIQUE INDEX "Stock_organizationId_warehouseId_productId_batchId_key" ON "Stock"("organizationId", "warehouseId", "productId", "batchId");
CREATE TABLE "new_Supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "contactPerson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Supplier" ("address", "id", "name", "phone") SELECT "address", "id", "name", "phone" FROM "Supplier";
DROP TABLE "Supplier";
ALTER TABLE "new_Supplier" RENAME TO "Supplier";
CREATE TABLE "new_SupplierLedgerEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "referenceId" TEXT,
    "balance" REAL NOT NULL,
    CONSTRAINT "SupplierLedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierLedgerEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SupplierLedgerEntry" ("amount", "balance", "date", "description", "id", "referenceId", "supplierId", "type") SELECT "amount", "balance", "date", "description", "id", "referenceId", "supplierId", "type" FROM "SupplierLedgerEntry";
DROP TABLE "SupplierLedgerEntry";
ALTER TABLE "new_SupplierLedgerEntry" RENAME TO "SupplierLedgerEntry";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'cashier',
    "fullName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_User" ("fullName", "id", "isActive", "passwordHash", "role", "username") SELECT "fullName", "id", "isActive", "passwordHash", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_organizationId_username_key" ON "User"("organizationId", "username");
CREATE TABLE "new_Warehouse" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "Warehouse_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Warehouse" ("description", "id", "name", "type") SELECT "description", "id", "name", "type" FROM "Warehouse";
DROP TABLE "Warehouse";
ALTER TABLE "new_Warehouse" RENAME TO "Warehouse";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_key_key" ON "AppSettings"("key");
