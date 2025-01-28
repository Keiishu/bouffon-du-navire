import { Module } from "@nestjs/common";
import { TreeStatsService } from "./tree-stats.service";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [TreeStatsService],
})
export class TreeStatsModule {
}
