import { Injectable, Logger } from "@nestjs/common";
import { ActivityType } from "discord.js";
import { Context, ContextOf, On, Once } from "necord";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  @Once("ready")
  public async onReady(@Context() [client]: ContextOf<"ready">) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
    client.user.setActivity("les Fragilités Loliennes", {type: ActivityType.Listening});
  }

  @On("warn")
  public onWarn(@Context() [info]: ContextOf<"warn">) {
    this.logger.warn(info);
  }
}
