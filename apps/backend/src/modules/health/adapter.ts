import type { Connection } from "mongoose";
import type { RedisClientType } from "redis";
import type { DataSource } from "typeorm";

import type { ICacheAdapter } from "@/infra/cache";

import type {
	DatabaseConnectionOutput,
	DatabaseMemoryOutput,
	HealthStatus,
	Load,
	MemotyOutput,
} from "./types";

export abstract class IHealthAdapter {
	abstract mongo: Connection;
	abstract postgres: DataSource;
	abstract redis: ICacheAdapter<RedisClientType>;
	abstract getMongoStatus(): HealthStatus;
	abstract getRedisStatus(): Promise<HealthStatus>;
	abstract getPostgresStatus(): Promise<HealthStatus>;
	abstract getMemoryUsageInMB(): MemotyOutput;
	abstract getLoadAvarage(time: number, numCpus: number): Load;
	abstract getActiveConnections(): Promise<unknown>;
	abstract getLatency(host?: string): Promise<unknown>;
	abstract getMongoConnections(): Promise<DatabaseConnectionOutput>;
	abstract getPostgresConnections(): Promise<DatabaseConnectionOutput>;
	abstract getPostgresMemory(): Promise<DatabaseMemoryOutput>;
	abstract getMongoMemory(): Promise<DatabaseMemoryOutput>;
	abstract getCPUCore(): Promise<{ cpus: { load: number }[] }>;
}
