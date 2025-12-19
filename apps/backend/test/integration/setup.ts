import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import  request from 'supertest';
import { AppModule } from '../../src/app.module';
import { afterAll, beforeAll } from 'vitest';

export function createIntegrationTest(
  moduleBuilder: (module: TestingModule) => void = () => {},
) {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    moduleBuilder(moduleFixture);

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  return {
    getApp: () => app,
    request: () => request(app.getHttpServer()),
  };
}
