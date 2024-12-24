/*
  Warnings:

  - A unique constraint covering the columns `[message]` on the table `MessageReaction_Stimulus` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MessageReaction_Stimulus_message_key" ON "MessageReaction_Stimulus"("message");
