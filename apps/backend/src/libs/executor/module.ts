import { BullModule } from "@nestjs/bull";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { ContainerModule } from "@/modules/container/module";
import { LogModule } from "@/modules/log/module";
import { EventLibModule } from "../event";
import { LLMModule } from "../llm";

import { BrowserService } from "./browser.service";
import { DockerService } from "./docker.service";
import { ProcessorService } from "./processor.service";
import { EXECUTOR_QUEUE, QueueService } from "./queue.service";
import { TerminalService } from "./terminal.service";

@Global()
@Module({
	imports: [
		EventLibModule,
		LLMModule,
		LogModule,
		ContainerModule,
		BullModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				redis: {
					host: configService.get<string>("app.redis.host") || "localhost",
					port: configService.get<number>("app.redis.port") || 6379,
				},
			}),
			inject: [ConfigService],
		}),
		BullModule.registerQueue({
			name: EXECUTOR_QUEUE,
		}),
	],
	providers: [
		QueueService,
		ProcessorService,
		DockerService,
		BrowserService,
		TerminalService,
	],
	exports: [
		QueueService,
		ProcessorService,
		DockerService,
		BrowserService,
		TerminalService,
	],
})
export class ExecutorModule {}
