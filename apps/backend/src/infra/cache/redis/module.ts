import { Module } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";

import { ILoggerAdapter, LoggerModule } from "@/infra/logger";
import { ISecretsAdapter, SecretsModule } from "@/infra/secrets";

import { ICacheAdapter } from "../adapter";
import { MemoryCacheService } from "../memory/service";
import { RedisService } from "./service";

@Module({
	imports: [LoggerModule, SecretsModule],
	providers: [
		{
			provide: ICacheAdapter,
			useFactory: async (
				{ REDIS_URL }: ISecretsAdapter,
				logger: ILoggerAdapter,
			) => {
				const skipRedis = process.env.NODE_ENV === "test"
					&& process.env.SKIP_REDIS !== "false";

				if (skipRedis) {
					const memoryCache = new MemoryCacheService(logger);
					memoryCache.connect();
					return memoryCache;
				}

				const client = createClient({ url: REDIS_URL }) as RedisClientType;
				const cacheService = new RedisService(logger, client);
				await cacheService.connect();
				return cacheService;
			},
			inject: [ISecretsAdapter, ILoggerAdapter],
		},
	],
	exports: [ICacheAdapter],
})
export class RedisCacheModule {}
