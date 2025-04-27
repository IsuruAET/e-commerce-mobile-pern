/*
  Warnings:

  - You are about to drop the column `date` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `time` on the `Appointment` table. All the data in the column will be lost.
  - Added the required column `dateTime` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- First add the new column as nullable
ALTER TABLE "Appointment" ADD COLUMN "dateTime" TIMESTAMP(3);

-- Combine date and time into dateTime
UPDATE "Appointment"
SET "dateTime" = date_trunc('day', "date") + CAST(CAST("time" AS TIME) AS INTERVAL);

-- Make dateTime not nullable
ALTER TABLE "Appointment" ALTER COLUMN "dateTime" SET NOT NULL;

-- Drop old indexes
DROP INDEX "Appointment_date_idx";
DROP INDEX "Appointment_time_idx";

-- Drop old columns
ALTER TABLE "Appointment" DROP COLUMN "date",
DROP COLUMN "time";

-- Create new index
CREATE INDEX "Appointment_dateTime_idx" ON "Appointment"("dateTime");
