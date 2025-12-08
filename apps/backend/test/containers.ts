import path from "node:path";
import {
	MongoDBContainer,
	type StartedMongoDBContainer,
} from "@testcontainers/mongodb";
import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import {
	RedisContainer,
	type StartedRedisContainer,
} from "@testcontainers/redis";
import mongoose from "mongoose";
import { createClient, type RedisClientType } from "redis";
import { DataSource, type DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

import { RedisService } from "@/infra/cache/redis";
import type { ConnectionName } from "@/infra/database/enum";
import { PostgresService } from "@/infra/database/postgres";
import { type ILoggerAdapter, LoggerService } from "@/infra/logger";

export class TestMongoContainer {
	mongoContainer!: StartedMongoDBContainer;

	getTestMongo = async (
		conectionName: ConnectionName,
	): Promise<{ mongoConnection: mongoose.Connection }> => {
		try {
			this.mongoContainer = await new MongoDBContainer("mongo:7.0.2").start();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to start MongoDB container: ${errorMessage}. ` +
					"Please ensure Docker is installed and running. " +
					"On Windows, make sure Docker Desktop is started. " +
					"You can verify Docker is running by executing: docker ps",
			);
		}

		const mongo: mongoose.Connection = mongoose
			.createConnection(this.mongoContainer.getConnectionString(), {
				directConnection: true,
				appName: conectionName,
			})
			.useDb("nestjs-microservice");
		return { mongoConnection: mongo };
	};

	async close() {
		if (this.mongoContainer) {
			try {
				await this.mongoContainer.stop();
			} catch (error) {
				// Log but don't throw - cleanup should be best-effort
				console.error("Error stopping MongoDB container:", error);
			}
		}
	}
}

export class TestPostgresContainer {
	postgresContainer!: StartedPostgreSqlContainer;

	getTestPostgres = async (): Promise<StartedPostgreSqlContainer> => {
		const postgres = new PostgreSqlContainer("postgres:16.1-alpine");
		postgres.withDatabase("nestjs-microservice");

		try {
			this.postgresContainer = await postgres.start();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to start PostgreSQL container: ${errorMessage}. ` +
					"Please ensure Docker is installed and running. " +
					"On Windows, make sure Docker Desktop is started. " +
					"You can verify Docker is running by executing: docker ps",
			);
		}

		return this.postgresContainer;
	};

	async getDataSource(options: DataSourceOptions | undefined) {
		const dataSource = new DataSource(options as DataSourceOptions);
		const source = await dataSource.initialize();
		return source;
	}

	getConfiguration = (
		postgresConection: StartedPostgreSqlContainer,
		pathname: string,
	) => {
		const conn = new PostgresService().getConnection({
			URI: postgresConection.getConnectionUri(),
		});
		return {
			...conn,
			timeout: 5000,
			connectTimeout: 5000,
			logging: false,
			// Disable migrations in test environment - use synchronize instead
			// TypeScript migration files cause syntax errors when loaded directly
			migrationsRun: false,
			migrations: [], // Explicitly set to empty array to prevent loading migration files
			synchronize: true, // Auto-create schema in tests
			autoLoadEntities: true,
			namingStrategy: new SnakeNamingStrategy(),
			entities: [
				path.join(
					pathname,
					"../../../infra/database/postgres/schemas/*.{ts,js}",
				),
			],
		};
	};

	async close() {
		if (this.postgresContainer) {
			try {
				await this.postgresContainer.stop();
			} catch (error) {
				// Log but don't throw - cleanup should be best-effort
				console.error("Error stopping PostgreSQL container:", error);
			}
		}
	}
}

export class TestRedisContainer {
	redisContainer!: StartedRedisContainer;
	client!: RedisClientType;

	getTestRedis = async (): Promise<RedisService> => {
		const logger: ILoggerAdapter = {
			error: console.error,
			log: LoggerService.log,
		} as ILoggerAdapter;
		try {
			this.redisContainer = await new RedisContainer(
				"redis:7.2.4-alpine",
			).start();
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			throw new Error(
				`Failed to start Redis container: ${errorMessage}. ` +
					"Please ensure Docker is installed and running. " +
					"On Windows, make sure Docker Desktop is started. " +
					"You can verify Docker is running by executing: docker ps",
			);
		}
		this.client = createClient({
			url: this.redisContainer.getConnectionUrl(),
		}) as RedisClientType;
		await this.client.connect();
		const conn = new RedisService(logger, this.client);
		return conn;
	};

	async close() {
		if (this.client) {
			try {
				await this.client.disconnect();
			} catch (error) {
				// Log but don't throw - cleanup should be best-effort
				console.error("Error disconnecting Redis client:", error);
			}
		}
		if (this.redisContainer) {
			try {
				await this.redisContainer.stop();
			} catch (error) {
				// Log but don't throw - cleanup should be best-effort
				console.error("Error stopping Redis container:", error);
			}
		}
	}
}
