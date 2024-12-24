import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Context, ContextOf, On, Once, Options, SlashCommand, SlashCommandContext } from "necord";
import { Prisma } from "@prisma/client";
import { AddStimulusCommandDto } from "./dto/add-stimulus.command.dto";
import { MessageReaction_StimulusWithReactions } from "./types/stimulus.type";

@Injectable()
export class MessageReactionService {
  private readonly logger = new Logger(MessageReactionService.name);

  public stimuli: Array<MessageReaction_StimulusWithReactions>;

  constructor(private readonly dbService: PrismaService) {
  }

  @Once("ready")
  public async onReady() {
    this.stimuli = await this.dbService.messageReaction_Stimulus.findMany({include: {reactions: true}});

    this.logger.debug(`Stimuli loaded: [${this.stimuli.map(s => s.message).join(", ")}]`);
  }

  @On("messageCreate")
  public async onMessageCreate(@Context() [message]: ContextOf<"messageCreate">) {
    if (message.author.bot) return;

    this.logger.verbose(`Received message: ${message.content}`);

    // Check if one of the stimuli is in the message
    // If the stimuli is marked as not a keyword, check if the message only contains the stimulus
    const stimulus = this.stimuli.find(stimulus => {
      const content = message.content.toLowerCase();
      if (stimulus.keyword) {
        return content.split(/[\s\\.!?]/).includes(stimulus.message);
      } else {
        return content === stimulus.message;
      }
    });
    if (!stimulus) return;

    await message.reply(arrayChoose(stimulus.reactions).message);
  }

  @SlashCommand({
    name: "add-stimulus",
    description: "Add a stimulus to the bot",
    defaultMemberPermissions: ["ManageGuild"],
  })
  public async addStimulus(@Context() [interaction]: SlashCommandContext, @Options() options: AddStimulusCommandDto) {
    try {
      const stimulus: MessageReaction_StimulusWithReactions | null = await this.dbService.messageReaction_Stimulus.create({
        data: {
          message: options.message,
          keyword: options.keyword ?? undefined,  // We have to use undefined if null so that the default value is used
          reactions: {
            create: options.reactions.split("|").map(reaction => ({message: reaction})),
          },
        },
        include: {reactions: true},
      });
      this.logger.debug(`Added stimulus: ${stimulus.message}`);

      this.stimuli.push(stimulus);

      await interaction.reply(`Stimulus added: ${stimulus.message}`);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        await interaction.reply("Stimulus already exists");
      }
      await interaction.reply("Failed to add stimulus");
      this.logger.debug(`Failed to add stimulus: ${e.message}`);
    }
  }
}

function arrayChoose<T>(array: Array<T>): T {
  return array[Math.floor(Math.random() * array.length)];
}
