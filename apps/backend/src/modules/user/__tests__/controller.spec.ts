import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import request from "supertest";
import { TestPostgresContainer, TestRedisContainer } from "test/containers";
import type { Repository } from "typeorm";

import type { UserEntity } from "@/core/user/entity/user";
import { IUserRepository } from "@/core/user/repository/user";
import { ICacheAdapter } from "@/infra/cache";
import type { RedisService } from "@/infra/cache/redis";
import { UserSchema } from "@/infra/database/postgres/schemas/user";

import { UserModule } from "../module";
import { UserRepository } from "../repository";
import { afterAll, beforeAll, describe, it } from "vitest";

const describeIfDocker = process.env.SKIP_DOCKER_TESTS === "true"
	? describe.skip
	: describe;

describeIfDocker("User", () => {
	let app: INestApplication;

	const redisContainer = new TestRedisContainer();
	const postgresContainer = new TestPostgresContainer();

	beforeAll(
		async () => {
			const postgresConection = await postgresContainer.getTestPostgres();

			// Set environment variables for SecretsModule from testcontainer
			// PostgreSqlContainer defaults: username=test, password=test
			process.env.POSTGRES_USER = postgresConection.getUsername();
			process.env.POSTGRES_PASSWORD = postgresConection.getPassword();
			process.env.POSTGRES_HOST = postgresConection.getHost();
			process.env.POSTGRES_PORT = postgresConection.getPort().toString();
			process.env.POSTGRES_DATABASE = postgresConection.getDatabase();
			process.env.PGADMIN_URL = "http://localhost:5050"; // Mock URL for tests

			// Set other required environment variables for SecretsModule
			process.env.HOST = "localhost";
			process.env.PORT = "3000";
			process.env.LOG_LEVEL = "debug";
			process.env.DATE_FORMAT = "YYYY-MM-DD";
			process.env.TZ = "UTC";
			process.env.MONGO_URL = "mongodb://localhost:27017";
			process.env.MONGO_DATABASE = "test";
			process.env.MONGO_EXPRESS_URL = "http://localhost:8081";
			process.env.REDIS_URL = "redis://localhost:6379";
			process.env.ZIPKIN_URL = "http://localhost:9411";
			process.env.PROMETHUES_URL = "http://localhost:9090";
			process.env.GRAFANA_URL = "http://localhost:3001";
			process.env.TOKEN_EXPIRATION = "1h";
			process.env.REFRESH_TOKEN_EXPIRATION = "7d";
			process.env.JWT_SECRET_KEY = "test-secret-key-for-testing-only";
			process.env.EMAIL_HOST = "localhost";
			process.env.EMAIL_PORT = "587";
			process.env.EMAIL_USER = "test@test.com";
			process.env.EMAIL_PASS = "test";
			process.env.EMAIL_FROM = "test@test.com";
			process.env.GOOGLE_CLIENT_ID = "test-client-id";
			process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
			process.env.GOOGLE_REDIRECT_URI = "http://localhost:3000/auth/google/callback";

			const moduleRef = await Test.createTestingModule({
				imports: [
					UserModule,
					TypeOrmModule.forRootAsync({
						useFactory: () => {
							return postgresContainer.getConfiguration(
								postgresConection,
								__dirname,
							);
						},
						async dataSourceFactory(options) {
							return await postgresContainer.getDataSource(options);
						},
					}),
				],
			})
				.overrideProvider(IUserRepository)
				.useFactory({
					factory(repository: Repository<UserSchema & UserEntity>) {
						return new UserRepository(repository);
					},
					inject: [getRepositoryToken(UserSchema)],
				})
				.overrideProvider(ICacheAdapter)
				.useFactory({
					async factory(): Promise<RedisService> {
						const conn = await redisContainer.getTestRedis();
						return conn;
					},
				})
				.compile();

			app = moduleRef.createNestApplication();
			await app.init();
		},
		120000, // 2 minutes timeout for Docker container startup
	);
	it(`/GET /v1/users`, async () => {
		return request(app.getHttpServer())
			.get("/users")
			.set("Authorization", `Bearer ${process.env.TOKEN_TEST}`)
			.expect(200);
	});

	afterAll(
		async () => {
			try {
				await postgresContainer.close();
			} catch (error) {
				console.error("Error closing PostgreSQL container:", error);
			}
			try {
				await redisContainer.close();
			} catch (error) {
				console.error("Error closing Redis container:", error);
			}
			try {
				if (app) {
					await app.close();
				}
			} catch (error) {
				console.error("Error closing app:", error);
			}
		},
		60000, // 1 minute timeout for cleanup
	);
});
