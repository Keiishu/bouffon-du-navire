-- CreateTable
CREATE TABLE "MessageReaction_Stimulus" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "keyword" BOOLEAN NOT NULL DEFAULT true,
    "stickers" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MessageReaction_Stimulus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReaction_Response" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT NOT NULL,
    "stimulusId" TEXT NOT NULL,

    CONSTRAINT "MessageReaction_Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_Stimulus_message_key" ON "MessageReaction_Stimulus"("message");

-- AddForeignKey
ALTER TABLE "MessageReaction_Response" ADD CONSTRAINT "MessageReaction_Response_stimulusId_fkey" FOREIGN KEY ("stimulusId") REFERENCES "MessageReaction_Stimulus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
