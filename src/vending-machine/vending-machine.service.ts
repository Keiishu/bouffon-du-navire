import { Inject, Injectable, Logger, UseInterceptors } from "@nestjs/common";
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { Context, createCommandGroupDecorator, On, Options, SlashCommandContext, Subcommand } from "necord";
import { PrismaService } from "../prisma/prisma.service";
import { VendingMachine_Product } from "@prisma/client";
import { SchedulerRegistry } from "@nestjs/schedule";
import { type createClient, PhotosWithTotalResults } from "pexels";
import { throwError } from "src/utils/interactions.utils";
import { EmbedBuilder } from "discord.js";
import { VendingMachineInterceptor } from "./interceptors/vending-machine.interceptor";
import { AddProductCommandDto } from "./dto/add-product-command.dto";
import { BuyProductCommandDto } from "./dto/buy-product-command.dto";
import { RemoveProductCommandDto } from "./dto/remove-product-command.dto";

export const VendingMachineCommandDecorator = createCommandGroupDecorator({
  name: "vending-machine",
  description: "Vending Machine Commands",
});

@Injectable()
@VendingMachineCommandDecorator()
export class VendingMachineService {
  private readonly logger = new Logger(VendingMachineService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache, private readonly prisma: PrismaService,
              private readonly schedulerRegistry: SchedulerRegistry, @Inject("Pexels") private readonly pexels: ReturnType<typeof createClient>) {
  }

  @On("ready")
  public async onReady() {
    await this.cacheManager.set("vending-machine:products", await this.prisma.vendingMachine_Product.findMany());
  }

  @UseInterceptors(VendingMachineInterceptor)
  @Subcommand({
    name: "buy",
    description: "Buy a product from the vending machine",
  })
  public async buy(@Context() [interaction]: SlashCommandContext, @Options() options: BuyProductCommandDto) {
    const products = await this.cacheManager.get("vending-machine:products") as VendingMachine_Product[];
    const product = options.product;

    if (!products.map((product) => product.name).includes(product)) {
      return interaction.reply("Product not found!");
    }

    if (await this.cacheManager.get(`vending-machine:timeout:${interaction.user.id}`)) {
      return interaction.reply("You have already bought a product recently, please wait a bit before buying another one!");
    }

    // Log the purchase
    await this.prisma.vendingMachine_Buy.create({
      data: {
        product: {
          connect: {
            id: products.find((p) => p.name === product).id,
          },
        },
        user: {
          connectOrCreate: {
            where: {
              discordId: interaction.user.id,
            },
            create: {
              discordId: interaction.user.id,
            },
          },
        },
      },
    });

    // Cache the fact that the user has bought a product
    await this.cacheManager.set(`vending-machine:timeout:${interaction.user.id}`, true);
    this.schedulerRegistry.addTimeout(`vending-machine:timeout:${interaction.user.id}`, setTimeout(() => {
      this.cacheManager.del(`vending-machine:timeout;${interaction.user.id}`);
    }, 1000 * 60 * 5));

    /// Get random picture
    // Check if the pictures are already cached, if not, fetch them
    if (!await this.cacheManager.get(`vending-machine:pictures:${product}`)) {
      let photos = await this.pexels.photos.search({query: product, per_page: 80});
      if ("error" in photos && photos.error) {
        this.logger.error(photos.error);
        await throwError("An error occurred while fetching the pictures!", interaction);
        throw new Error("An error occurred while fetching the pictures!");
      }
      photos = photos as PhotosWithTotalResults;

      await this.cacheManager.set(`vending-machine:pictures:${product}`, photos);
    }

    const photos = (await this.cacheManager.get(`vending-machine:pictures:${product}`) as PhotosWithTotalResults).photos;
    const randomPhoto = photos[Math.floor(Math.random() * photos.length)];

    const embed = new EmbedBuilder()
      .setTitle("Vending Machine")
      .setDescription(`${interaction.user.displayName} has bought a ${product}!`)
      .setColor("Greyple")
      .setImage(randomPhoto.src.original)
      .setFooter({text: `Picture by ${randomPhoto.photographer}, provided by [Pexels](https://www.pexels.com)`});

    return interaction.reply({embeds: [embed]});
  }

  @Subcommand({
    name: "products",
    description: "List all products available in the vending machine",
  })
  public async productsCommand(@Context() [interaction]: SlashCommandContext) {
    const products = await this.cacheManager.get("vending-machine:products") as VendingMachine_Product[];
    return interaction.reply(`Available products: ${products.map((product) => product.name).join(", ")}`);
  }
}

@Injectable()
@VendingMachineCommandDecorator({
  name: "admin",
  description: "Vending Machine Admin Commands",
  defaultMemberPermissions: ["ManageGuild"],
})
export class VendingMachineAdminService {
  private readonly logger = new Logger(VendingMachineAdminService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache, private readonly prisma: PrismaService) {
  }

  @Subcommand({
    name: "add-product",
    description: "Add a product to the vending machine",
  })
  public async addProduct(@Context() [interaction]: SlashCommandContext, @Options() options: AddProductCommandDto) {
    await this.prisma.vendingMachine_Product.create({
      data: {
        name: options.name,
      },
    });

    const products = await this.cacheManager.get("vending-machine:products") as VendingMachine_Product[];
    products.push({name: options.name} as VendingMachine_Product);
    await this.cacheManager.set("vending-machine:products", products);

    this.logger.log(`Product added: "${options.name}"`);

    return interaction.reply(`[Vending Machine] Product "${options.name}" added!`);
  }

  @UseInterceptors(VendingMachineInterceptor)
  @Subcommand({
    name: "remove-product",
    description: "Remove a product from the vending machine",
  })
  public async removeProduct(@Context() [interaction]: SlashCommandContext, @Options() options: RemoveProductCommandDto) {
    const product = (await this.cacheManager.get("vending-machine:products") as VendingMachine_Product[]).find((product) => product.name === options.name);
    if (!product) {
      return throwError("Product not found!", interaction);
    }

    await this.prisma.vendingMachine_Product.delete({where: {id: product.id}});

    const products = await this.cacheManager.get("vending-machine:products") as VendingMachine_Product[];
    await this.cacheManager.set("vending-machine:products", products.filter((p) => p.name !== options.name));

    this.logger.log(`Product removed: "${options.name}"`);

    return interaction.reply(`[Vending Machine] Product "${options.name}" removed!`);
  }
}
