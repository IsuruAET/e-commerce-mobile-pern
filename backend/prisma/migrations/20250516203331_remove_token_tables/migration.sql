/*
  Warnings:

  - You are about to drop the `PasswordCreationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PasswordResetToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PasswordCreationToken" DROP CONSTRAINT "PasswordCreationToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT "PasswordResetToken_userId_fkey";

-- DropForeignKey
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropTable
DROP TABLE "PasswordCreationToken";

-- DropTable
DROP TABLE "PasswordResetToken";

-- DropTable
DROP TABLE "RefreshToken";
