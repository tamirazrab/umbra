# Test Environment Variables

This document lists all the environment variables required for running e2e tests with testcontainers.

## PostgreSQL TestContainer Environment Variables

The `PostgreSqlContainer` from `@testcontainers/postgresql` provides these values:

- **POSTGRES_USER**: `test` (default testcontainer username)
- **POSTGRES_PASSWORD**: `test` (default testcontainer password)  
- **POSTGRES_HOST**: Dynamic (from `container.getHost()`)
- **POSTGRES_PORT**: Dynamic (from `container.getPort()`)
- **POSTGRES_DATABASE**: `nestjs-microservice` (set via `withDatabase()`)
- **PGADMIN_URL**: `http://localhost:5050` (mock URL for tests)

## MongoDB TestContainer Environment Variables

The `MongoDBContainer` from `@testcontainers/mongodb` provides:

- **MONGO_URL**: Dynamic connection string from `container.getConnectionString()`
- **MONGO_DATABASE**: `nestjs-microservice` (set in code)
- **MONGO_EXPRESS_URL**: `http://localhost:8081` (mock URL for tests)

## Redis TestContainer Environment Variables

The `RedisContainer` from `@testcontainers/redis` provides:

- **REDIS_URL**: Dynamic connection URL from `container.getConnectionUrl()`

## Other Required Environment Variables

These are set to mock/test values for the test environment:

- **NODE_ENV**: `test`
- **HOST**: `localhost`
- **PORT**: `3000`
- **LOG_LEVEL**: `debug`
- **DATE_FORMAT**: `YYYY-MM-DD`
- **TZ**: `UTC`
- **ZIPKIN_URL**: `http://localhost:9411`
- **PROMETHUES_URL**: `http://localhost:9090`
- **GRAFANA_URL**: `http://localhost:3001`
- **TOKEN_EXPIRATION**: `1h`
- **REFRESH_TOKEN_EXPIRATION**: `7d`
- **JWT_SECRET_KEY**: `test-secret-key-for-testing-only`
- **EMAIL_HOST**: `localhost`
- **EMAIL_PORT**: `587`
- **EMAIL_USER**: `test@test.com`
- **EMAIL_PASS**: `test`
- **EMAIL_FROM**: `test@test.com`
- **GOOGLE_CLIENT_ID**: `test-client-id`
- **GOOGLE_CLIENT_SECRET**: `test-client-secret`
- **GOOGLE_REDIRECT_URI**: `http://localhost:3000/auth/google/callback`
- **TOKEN_TEST**: Pre-configured JWT token for testing (set in `test/initialization.ts`)

## How to Extract Values from TestContainers

### PostgreSQL Container:
```typescript
const container = await postgresContainer.getTestPostgres();
process.env.POSTGRES_USER = container.getUsername(); // "test"
process.env.POSTGRES_PASSWORD = container.getPassword(); // "test"
process.env.POSTGRES_HOST = container.getHost(); // e.g., "localhost"
process.env.POSTGRES_PORT = container.getPort().toString(); // e.g., "5432"
process.env.POSTGRES_DATABASE = container.getDatabase(); // "nestjs-microservice"
```

### MongoDB Container:
```typescript
const container = await mongoContainer.getTestMongo();
process.env.MONGO_URL = container.getConnectionString(); // Full connection string
```

### Redis Container:
```typescript
const container = await redisContainer.getTestRedis();
process.env.REDIS_URL = container.redisContainer.getConnectionUrl(); // After container starts
```

## Notes

- All environment variables must be set **before** the NestJS module is created, as `SecretsModule` validates them during initialization
- The testcontainer connection details are dynamic and change for each test run
- Mock URLs (like PGADMIN_URL, MONGO_EXPRESS_URL) are fine for tests since they're not actually used

