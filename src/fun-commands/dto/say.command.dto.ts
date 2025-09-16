import { StringOption } from "necord";

export class SayCommandDto {
  @StringOption({
    name: "message",
    description: "The message for the bot to say",
    required: true,
  })
  public message: string;

  @StringOption({
    name: "reply",
    description: "The ID of the message to reply to (optional)",
    required: false,
  })
  public reply?: string;
}
