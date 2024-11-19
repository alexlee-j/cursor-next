/*
  Warnings:

  - A unique constraint covering the columns `[postId,userId,folderId]` on the table `favorites` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `folderId` to the `favorites` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "favorites_postId_userId_key";

-- AlterTable
ALTER TABLE "favorites" ADD COLUMN     "folderId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "favorite_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "favorite_folders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_folders_userId_name_key" ON "favorite_folders"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_postId_userId_folderId_key" ON "favorites"("postId", "userId", "folderId");

-- AddForeignKey
ALTER TABLE "favorite_folders" ADD CONSTRAINT "favorite_folders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "favorite_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
