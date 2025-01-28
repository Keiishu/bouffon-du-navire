-- CreateTable
CREATE TABLE "TreeStats_Trees" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TreeStats_Trees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeStats_Stats" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "treeId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TreeStats_Stats_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TreeStats_Stats" ADD CONSTRAINT "TreeStats_Stats_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "TreeStats_Trees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
