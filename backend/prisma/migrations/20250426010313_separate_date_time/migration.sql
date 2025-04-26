/*
  Warnings:

  - Added the required column `time` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "time" TIME NOT NULL,
ALTER COLUMN "date" SET DATA TYPE DATE;

-- CreateIndex
CREATE INDEX "Appointment_time_idx" ON "Appointment"("time");
