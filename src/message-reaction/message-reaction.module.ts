import { Module } from "@nestjs/common";
import { MessageReactionService } from "./message-reaction.service";
import { CacheModule } from "@nestjs/cache-manager";

@Module({
  imports: [CacheModule.register()],
  providers: [MessageReactionService],
  exports: [MessageReactionService],
})
export class MessageReactionModule {
}
