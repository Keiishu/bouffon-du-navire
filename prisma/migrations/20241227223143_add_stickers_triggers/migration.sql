-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MessageReaction_Stimulus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "message" TEXT NOT NULL,
    "keyword" BOOLEAN NOT NULL DEFAULT true,
    "stickers" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_MessageReaction_Stimulus" ("createdAt", "id", "keyword", "message", "updatedAt") SELECT "createdAt", "id", "keyword", "message", "updatedAt" FROM "MessageReaction_Stimulus";
DROP TABLE "MessageReaction_Stimulus";
ALTER TABLE "new_MessageReaction_Stimulus" RENAME TO "MessageReaction_Stimulus";
CREATE UNIQUE INDEX "MessageReaction_Stimulus_message_key" ON "MessageReaction_Stimulus"("message");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
