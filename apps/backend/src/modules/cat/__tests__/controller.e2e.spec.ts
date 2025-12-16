import { CatEntity } from "@/core/cat/entity/cat";
import { ICatRepository } from "@/core/cat/repository/cat";
import { ICacheAdapter } from "@/infra/cache";
import { RedisService } from "@/infra/cache/redis";
import { ConnectionName } from "@/infra/database/enum";
import {
  Cat,
  CatDocument,
  CatSchema,
} from "@/infra/database/mongo/schemas/cat";
import { ILoggerAdapter } from "@/infra/logger";
import { ITokenAdapter } from "@/libs/token";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import mongoose from "mongoose";
import { PaginateModel, Schema } from "mongoose";
import request from "supertest";
import { TestMongoContainer, TestRedisContainer } from "test/containers";
import { getUUID, mockFn, mockResolvedValue } from "test/mock";
import { afterAll, beforeAll, describe, it } from "vitest";
import { CatModule } from "../module";
import { CatRepository } from "../repository";

const describeIfDocker = process.env.SKIP_DOCKER_TESTS === "true"
	? describe.skip
	: describe;

describeIfDocker("Cats", () => {
  let app: INestApplication;
  let repository: ICatRepository;

  const containerMongo = new TestMongoContainer();
  const containerRedis = new TestRedisContainer();

  beforeAll(
    async () => {
      const { mongoConnection } = await containerMongo.getTestMongo(
        ConnectionName.CATS,
      );

      // Set environment variables for SecretsModule
      // MongoDB testcontainer defaults
      process.env.MONGO_URL =
        containerMongo.mongoContainer.getConnectionString();
      process.env.MONGO_DATABASE = "nestjs-microservice";
      process.env.MONGO_EXPRESS_URL = "http://localhost:8081";

      // Redis URL will be set after container starts - use temporary value for now
      process.env.REDIS_URL = "redis://localhost:6379";

      // Set other required environment variables for SecretsModule
      process.env.HOST = "localhost";
      process.env.PORT = "3000";
      process.env.LOG_LEVEL = "debug";
      process.env.DATE_FORMAT = "YYYY-MM-DD";
      process.env.TZ = "UTC";
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
      process.env.GOOGLE_REDIRECT_URI =
        "http://localhost:3000/auth/google/callback";

      const moduleRef = await Test.createTestingModule({
        imports: [CatModule],
      })
        .overrideProvider(ICatRepository)
        .useFactory({
          factory() {
            {
              type Model = mongoose.PaginateModel<CatDocument>;

              const repository: PaginateModel<CatDocument> =
                mongoConnection.model<CatDocument, Model>(
                  Cat.name,
                  CatSchema as Schema,
                );
              return new CatRepository(repository);
            }
          },
        })
        .overrideProvider(ICacheAdapter)
        .useFactory({
          async factory(): Promise<RedisService> {
            const redis = await containerRedis.getTestRedis();
            // Update Redis URL after container starts
            if (containerRedis.redisContainer) {
              process.env.REDIS_URL =
                containerRedis.redisContainer.getConnectionUrl();
            }
            return redis;
          },
          inject: [],
        })
        .overrideProvider(ITokenAdapter)
        .useValue({
          sign: mockFn(),
          verify: mockResolvedValue({
            email: "test@test.com",
            name: "test",
            id: getUUID(),
          }),
        })
        .overrideProvider(ILoggerAdapter)
        .useValue({
          logger: mockFn(), // HttpLogger function that takes (request, response)
          connect: mockFn(),
          setApplication: mockFn(),
          log: mockFn(),
          debug: mockFn(),
          info: mockFn(),
          warn: mockFn(),
          error: mockFn(),
          fatal: mockFn(),
          setGlobalParameters: mockFn(),
        })
        .compile();

      app = moduleRef.createNestApplication();
      repository = app.get(ICatRepository);
      await app.init();
    },
    120000, // 2 minutes timeout for Docker container startup
  );

  it(`/GET /v1/cats`, async () => {
    await repository.create(
      new CatEntity({ id: getUUID(), name: "Miau", age: 10, breed: "siamese" }),
    );

    return request(app.getHttpServer())
      .get("/cats")
      .set("Authorization", `Bearer ${process.env.TOKEN_TEST}`)
      .expect(200);
  });

  afterAll(
    async () => {
      try {
        await containerMongo.close();
      } catch (error) {
        console.error("Error closing MongoDB container:", error);
      }
      try {
        await containerRedis.close();
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
