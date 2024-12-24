import { BooleanOption, StringOption } from "necord";

export class AddStimulusCommandDto {
  @StringOption({
    name: "message",
    description: "The message to react to",
    required: true,
  })
  public message: string;

  @StringOption({
    name: "reactions",
    description: "The reactions to the message, separated by vertical bars",
    required: true,
  })
  public reactions: string;

  @BooleanOption({
    name: "keyword",
    description: "Whether the message should be treated as a keyword",
    required: false,
  })
  public keyword: boolean;
}
