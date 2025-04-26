/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Service_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");
