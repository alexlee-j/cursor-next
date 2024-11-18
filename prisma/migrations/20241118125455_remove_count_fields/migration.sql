/*
  Warnings:

  - You are about to drop the column `favoritesCount` on the `posts` table. All the data in the column will be lost.
  - You are about to drop the column `likesCount` on the `posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "posts" DROP COLUMN "favoritesCount",
DROP COLUMN "likesCount";
