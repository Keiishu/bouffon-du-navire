import { Injectable, Logger } from "@nestjs/common";
import { Context, ContextOf, On, Once } from "necord";
import { Client, Message, TextChannel } from "discord.js";
import { PrismaService } from "../prisma/prisma.service";
import { Cron, CronExpression } from "@nestjs/schedule";

interface ScoreboardEntry {
  rank: number;
  name: string;
  height: number;
}

interface TreeStatsGrowthRate {
  name: string;
  height: number;
  growth_rate_ft_per_hour: number;
}

@Injectable()
export class TreeStatsService {
  private readonly logger = new Logger(TreeStatsService.name);

  private readonly MESSAGE_ID = "1332133523099877377";
  private readonly CHANNEL_ID = "1332041209903972375";
  private scoreboardMessage: Message | null = null;
  private cronRunning = false;

  constructor(private readonly dbService: PrismaService, private readonly client: Client) {
  }

  @Once("ready")
  public onReady(@Context() [client]: ContextOf<"ready">) {
    this.logger.debug("TreeStats loaded");
    this.runPredictions().then();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  private async runPredictions() {
    if (this.cronRunning) {
      this.logger.debug("Cron already running, skipping");
      return;
    }
    this.cronRunning = true;

    this.logger.debug("Running predictions");

    const channel = this.client.channels.cache.get(this.CHANNEL_ID) as TextChannel;

    let newMessage = await channel.messages.fetch(this.MESSAGE_ID);
    console.log("newMessage", newMessage.embeds[0].data.description);
    console.log("this.scoreboardMessage", this.scoreboardMessage?.embeds[0].data.description);
    // If the scoreboard hasn't changed, we need to wait for it to be updated by a user
    if (newMessage.embeds[0].data.description === this.scoreboardMessage?.embeds[0].data.description) {
      console.log("Scoreboard hasn't changed");
      // Ask a user to refresh the scoreboard, and only continue when the scoreboard has been updated
      const reply = await newMessage.reply("Please refresh the scoreboard");
      do {
        console.log("Waiting for scoreboard to be updated");
        newMessage = await newMessage.fetch();
        console.log("newMessage DO", newMessage.embeds[0].data.description);
        console.log("this.scoreboardMessage DO", this.scoreboardMessage.embeds[0].data.description);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } while (newMessage.embeds[0].data.description === this.scoreboardMessage.embeds[0].data.description);
      console.log("Scoreboard updated");
      await reply.delete();
    }
    this.scoreboardMessage = structuredClone(newMessage);

    const parsedScoreboard: ScoreboardEntry[] = this.parseScoreboard(this.scoreboardMessage.embeds[0].data.description);
    console.log(parsedScoreboard);
    await this.saveScoreboard(parsedScoreboard);

    const treeStats: TreeStatsGrowthRate[] = await this.dbService.$queryRaw`
        WITH growth_data AS
                 (SELECT name,
                         height,
                         date,
                         height - LAG(height) OVER (PARTITION BY name ORDER BY date) AS growth,
                         EXTRACT(EPOCH FROM (date - LAG(date) OVER (PARTITION BY name ORDER BY date))) /
                         3600                                                        AS time_delta_hours
                  FROM "TreeStats_Trees"
                           JOIN public."TreeStats_Stats" TSS on "TreeStats_Trees".id = TSS."treeId")
        SELECT name,
               height,
               growth / NULLIF(time_delta_hours, 0) AS growth_rate_ft_per_hour,
               date
        FROM growth_data
        WHERE time_delta_hours IS NOT NULL
        ORDER BY name, date;
    `;

    const alpha = 0.5;
    const beta = 0.1;
    const hours = 2;
    const predictions = this.makePrediction(treeStats, alpha, beta, hours);
    console.log(predictions);

    for (const [name, prediction] of predictions) {
      const currentHeight = treeStats.filter((tree) => tree.name === name).slice(-1)[0].height;
      const predictedHeight = currentHeight + prediction * hours;
      console.log(`Prediction for ${name}: ${predictedHeight.toFixed(2)} ft`);
      await channel.send(`Prediction for ${name} in ${hours}h: ${predictedHeight.toFixed(2)} ft`);
    }

    //console.dir(treeStats, {depth: null});
    this.logger.debug("Predictions finished");

    this.cronRunning = false;
  }

  private parseScoreboard(scoreboard: string): ScoreboardEntry[] {
    return scoreboard
      .trim()
      .split("\n")
      .map((line) => {
        const match = /^``#(?<rank>\d+)`` - ``(?<name>.+)`` - (?<height>.+)$/gm.exec(line);
        if (!match) throw new Error(`Invalid line: ${line}`);
        return {
          rank: parseInt(match.groups.rank),
          name: match.groups.name.trim(),
          height: parseFloat(match.groups.height.replace(/(ft)|(ft ��)|(ft 📍)/, "")),
        };
      }).filter((entry) => entry.name == "trukipouss");
  }

  private async saveScoreboard(scoreboard: ScoreboardEntry[]) {
    for (const {rank, name, height} of scoreboard) {
      await this.dbService.treeStats_Trees.upsert({
        where: {name},
        create: {
          name,
          stats: {
            create: {
              height,
              rank,
            },
          },
        },
        update: {
          stats: {
            create: {
              height,
              rank,
            },
          },
        },
      });
    }
  }

  // Basic exponential smoothing algorithm
  // https://en.wikipedia.org/wiki/Exponential_smoothing
  private exponentialSmoothing(data: number[], alpha: number): number[] {
    if (data.length === 0) return [];

    const smoothed = [data[0]];
    for (let i = 1; i < data.length; i++) {
      smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
    }
    return smoothed;
  }

  // Second order exponential smoothing algorithm
  private sndOrdExpSmoothing(data: number[], alpha: number, beta: number): { smoothed: number[], trend: number[] } {
    if (data.length === 0) return {smoothed: [], trend: []};
    if (data.length < 2) return {smoothed: data, trend: new Array(data.length).fill(0)};

    const smoothed = [data[0]];
    const trend = [data[1] - data[0]];
    for (let i = 1; i < data.length; i++) {
      smoothed.push(alpha * data[i] + (1 - alpha) * (smoothed[i - 1] + trend[i - 1]));
      trend.push(beta * (smoothed[i] - smoothed[i - 1]) + (1 - beta) * trend[i - 1]);
    }
    return {smoothed, trend};
  }

  // TODO: Maybe just query the database for the last N entries and calculate the average directly
  private rollingAverage(data: number[], windowSize: number): number[] {
    if (data.length === 0) return [];

    const smoothed: number[] = [];
    for (let i = 0; i < data.length; i++) {
      const window = data.slice(Math.max(0, i - windowSize), i + 1);
      // Calculate the average of the window
      smoothed.push(window.reduce((a, b) => a + b) / window.length);
    }
    return smoothed;
  }

  private makePrediction(data: TreeStatsGrowthRate[], alpha: number, beta: number, hours: number): Map<string, number> {
    // Group the data by tree name, into a Map
    const treeGrowthRatesMap = new Map<string, number[]>();
    for (const {name, growth_rate_ft_per_hour} of data) {
      if (!treeGrowthRatesMap.has(name)) {
        treeGrowthRatesMap.set(name, []);
      }
      treeGrowthRatesMap.get(name).push(growth_rate_ft_per_hour);
    }

    const predictions = new Map<string, number>();

    for (const [name, growthRates] of treeGrowthRatesMap) {
      const {smoothed, trend} = this.sndOrdExpSmoothing(growthRates, alpha, beta);

      // Get the last smoothed value and last trend estimate
      const lastSmoothed = smoothed[smoothed.length - 1];
      const lastTrend = trend[trend.length - 1];

      // Calculate the prediction for the next N days
      const prediction = lastSmoothed + lastTrend * hours;

      predictions.set(name, prediction);
    }
    return predictions;
  }

  @On("messageUpdate")
  public onMessageUpdate(@Context() [oldMessage, newMessage]: ContextOf<"messageUpdate">) {
    if (oldMessage.id === this.MESSAGE_ID) {
      //console.log("Message updated:", oldMessage);
    }
  }
}
