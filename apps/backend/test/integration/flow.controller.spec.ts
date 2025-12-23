import { FlowCreateInput } from "@/core/flow/use-cases/flow-create";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../../src/app.module";
import { FlowStatus } from "@/core/flow/entity/flow";

const describeIfDocker =
  process.env.SKIP_DOCKER_TESTS === "true" ? describe.skip : describe;

describeIfDocker("FlowController (Integration)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /flows", () => {
    it("should create a flow with valid input", async () => {
      const input: FlowCreateInput = {
        modelProvider: "openai",
        model: "gpt-4",
      };

      const response = await request(app.getHttpServer())
        .post("/flows")
        .send(input)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.model.provider).toBe(input.modelProvider);
      expect(response.body.model.id).toBe(input.model);
      expect(response.body.status).toBe(FlowStatus.IN_PROGRESS);
    });

    it("should fail with invalid input", async () => {
      const input = {
        modelProvider: "", // Invalid
        model: "gpt-4",
      };

      await request(app.getHttpServer()).post("/flows").send(input).expect(400);
    });
  });

  describe("GET /flows/:id", () => {
    it("should return 404 for non-existent flow", async () => {
      await request(app.getHttpServer())
        .get("/flows/999999") // Assuming numeric ID or non-existent UUID
        .expect(404);
    });
  });
});
