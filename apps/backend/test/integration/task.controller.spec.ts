import { TaskCreateInput } from '@/core/task/use-cases/task-create';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const describeIfDocker = process.env.SKIP_DOCKER_TESTS === 'true'
  ? describe.skip
  : describe;

describeIfDocker('TaskController (Integration)', () => {
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

  describe('POST /tasks', () => {
    it('should create a task with valid input', async () => {
      const input: TaskCreateInput = {
        flowId: 1,
        type: 'ask',
        message: 'Test task',
      };

      // Note: This assumes flowId 1 exists or validation is mocked/skipped for integration
      // In a real integration test with DB, we'd create a flow first
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .send(input)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.type).toBe(input.type);
      expect(response.body.message).toBe(input.message);
    });

    it('should fail with invalid input', async () => {
      const input = {
        flowId: 'invalid', // Should be number
        type: 'unknown_type', // Invalid enum
      };

      await request(app.getHttpServer())
        .post('/tasks')
        .send(input)
        .expect(400);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .get('/tasks/999999')
        .expect(404);
    });
  });
});
