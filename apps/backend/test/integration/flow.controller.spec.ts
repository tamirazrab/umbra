import { FlowCreateInput } from '@/core/flow/use-cases/flow-create';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('FlowController (Integration)', () => {
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

  describe('POST /flows', () => {
    it('should create a flow with valid input', async () => {
      const input: FlowCreateInput = {
        modelProvider: 'openai',
        modelId: 'gpt-4',
      };

      const response = await request(app.getHttpServer())
        .post('/flows')
        .send(input)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.model.provider).toBe(input.modelProvider);
      expect(response.body.model.id).toBe(input.modelId);
      expect(response.body.status).toBe('in_progress');
    });

    it('should fail with invalid input', async () => {
      const input = {
        modelProvider: '', // Invalid
        modelId: 'gpt-4',
      };

      await request(app.getHttpServer())
        .post('/flows')
        .send(input)
        .expect(400);
    });
  });

  describe('GET /flows/:id', () => {
    it('should return 404 for non-existent flow', async () => {
      await request(app.getHttpServer())
        .get('/flows/999999') // Assuming numeric ID or non-existent UUID
        .expect(404);
    });
  });
});
