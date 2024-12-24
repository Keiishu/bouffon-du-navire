import { Injectable, Logger } from "@nestjs/common";
import { Context, ContextOf, On, Once } from "necord";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  @Once("ready")
  public onReady(@Context() [client]: ContextOf<"ready">) {
    this.logger.log(`Bot logged in as ${client.user.username}`);
  }

  @On("warn")
  public onWarn(@Context() [info]: ContextOf<"warn">) {
    this.logger.warn(info);
  }
}
