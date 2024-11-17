/*
  Warnings:

  - You are about to drop the `verification_codes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "verification_codes" DROP CONSTRAINT "verification_codes_userId_fkey";

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "excerpt" TEXT,
ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'markdown';

-- DropTable
DROP TABLE "verification_codes";

-- CreateTable
CREATE TABLE "verify_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "verify_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verify_tokens_token_key" ON "verify_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verify_tokens_userId_key" ON "verify_tokens"("userId");

-- AddForeignKey
ALTER TABLE "verify_tokens" ADD CONSTRAINT "verify_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
