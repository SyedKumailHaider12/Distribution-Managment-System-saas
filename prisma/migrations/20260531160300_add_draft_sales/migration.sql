-- CreateTable
CREATE TABLE "DraftSale" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "organizationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "customerId" INTEGER,
    "salesmanId" INTEGER,
    "warehouseId" INTEGER,
    "saleType" TEXT NOT NULL DEFAULT 'retail',
    "items" TEXT NOT NULL,
    "discount" REAL NOT NULL DEFAULT 0,
    "discountType" TEXT NOT NULL DEFAULT 'percentage',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DraftSale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DraftSale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
