import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { Stimuli } from "./message-reaction/stimuli";

const prisma = new PrismaClient();

async function main() {
  // message-reaction
  const stimuli: Stimuli = JSON.parse(fs.readFileSync(`${path.dirname(require.main.filename)}/message-reaction/stimuli.json`, "utf-8")).stimuli;
  for (const stimulus of stimuli) {
    await prisma.messageReaction_Stimulus.upsert({
      where: {message: stimulus.message},
      update: {},
      create: {
        message: stimulus.message,
        keyword: stimulus.keyword,
        reactions: {
          create: stimulus.reactions.map(reaction => ({message: reaction})),
        },
      },
      include: {reactions: true},
    });
  }
}

main()
  .catch(e => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
