/*
  Warnings:

  - A unique constraint covering the columns `[blogNo]` on the table `Post` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Post_blogNo_key" ON "Post"("blogNo");
