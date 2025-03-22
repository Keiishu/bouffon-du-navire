import { Module } from "@nestjs/common";
import { VendingMachineService } from "./vending-machine.service";
import { CacheModule } from "@nestjs/cache-manager";
import { VendingMachineInterceptor } from "./interceptors/vending-machine.interceptor";
import { ConfigService } from "@nestjs/config";
import { createClient } from "pexels";

@Module({
  imports: [CacheModule.register()],
  providers: [VendingMachineService, VendingMachineInterceptor,
    {
      name: "Pexels",
      provide: "Pexels",
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return createClient(config.getOrThrow("PEXELS_API_KEY"));
      },
    },
  ],
})

export class VendingMachineModule {
}
