import { Injectable, Logger } from "@nestjs/common";
import { Context, Options, SlashCommand, SlashCommandContext } from "necord";
import { SayCommandDto } from "./dto/say.command.dto";
import { MessageFlagsBitField } from "discord.js";

@Injectable()
export class FunCommandsService {
  private readonly logger = new Logger(FunCommandsService.name);

  @SlashCommand({
    name: "say",
    description: "Make the bot say something",
    defaultMemberPermissions: ["ManageGuild"],
  })
  async say(@Context() [interaction]: SlashCommandContext, @Options() options: SayCommandDto) {
    if (options.reply) {
      const replyMessage = await interaction.channel.messages.fetch(options.reply);
      await replyMessage.reply(options.message);
    } else {
      await interaction.channel.send(options.message);
    }
    await interaction.reply({ content: "Message sent!", flags: MessageFlagsBitField.Flags.Ephemeral });
  }
}
