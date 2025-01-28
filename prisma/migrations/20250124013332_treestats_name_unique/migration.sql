/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `TreeStats_Trees` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TreeStats_Trees_name_key" ON "TreeStats_Trees"("name");
