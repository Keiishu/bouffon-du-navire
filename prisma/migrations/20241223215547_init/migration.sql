-- CreateTable
CREATE TABLE "MessageReaction_Stimulus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "message" TEXT NOT NULL,
    "keyword" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "MessageReaction_Response" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "message" TEXT NOT NULL,
    "stimulusId" TEXT NOT NULL,
    CONSTRAINT "MessageReaction_Response_stimulusId_fkey" FOREIGN KEY ("stimulusId") REFERENCES "MessageReaction_Stimulus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
