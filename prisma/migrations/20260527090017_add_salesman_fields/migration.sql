/*
  Warnings:

  - Added the required column `name` to the `Salesman` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Salesman" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "areaId" INTEGER,
    "commissionRate" REAL NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "target" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Salesman_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Salesman_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Salesman" ("areaId", "commissionRate", "employeeId", "id") SELECT "areaId", "commissionRate", "employeeId", "id" FROM "Salesman";
DROP TABLE "Salesman";
ALTER TABLE "new_Salesman" RENAME TO "Salesman";
CREATE UNIQUE INDEX "Salesman_employeeId_key" ON "Salesman"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
