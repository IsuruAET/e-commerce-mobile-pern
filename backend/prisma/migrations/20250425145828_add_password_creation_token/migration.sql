-- CreateTable
CREATE TABLE "PasswordCreationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordCreationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordCreationToken_token_key" ON "PasswordCreationToken"("token");

-- CreateIndex
CREATE INDEX "PasswordCreationToken_userId_idx" ON "PasswordCreationToken"("userId");

-- AddForeignKey
ALTER TABLE "PasswordCreationToken" ADD CONSTRAINT "PasswordCreationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
