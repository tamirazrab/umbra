import { vi } from "vitest";

// Provide sane defaults so the SecretsModule schema validation passes in tests
process.env.NODE_ENV = "test";
process.env.ENV = "test";
process.env.IS_LOCAL = "false";
process.env.IS_PRODUCTION = "false";
process.env.HOST = "localhost";
process.env.PORT = "3000";
process.env.LOG_LEVEL = "debug";
process.env.DATE_FORMAT = "YYYY-MM-DD";
process.env.TZ = "UTC";
process.env.MONGO_URL = process.env.MONGO_URL ?? "mongodb://localhost:27017";
process.env.MONGO_DATABASE = process.env.MONGO_DATABASE ?? "test-db";
process.env.MONGO_EXPRESS_URL =
	process.env.MONGO_EXPRESS_URL ?? "http://localhost:8081";
process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? "postgres";
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "postgres";
process.env.POSTGRES_HOST = process.env.POSTGRES_HOST ?? "localhost";
process.env.POSTGRES_PORT = process.env.POSTGRES_PORT ?? "5432";
process.env.POSTGRES_DATABASE = process.env.POSTGRES_DATABASE ?? "postgres";
process.env.PGADMIN_URL =
	process.env.PGADMIN_URL ?? "http://localhost:5050/console";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
process.env.ZIPKIN_URL = process.env.ZIPKIN_URL ?? "http://localhost:9411";
process.env.PROMETHUES_URL =
	process.env.PROMETHUES_URL ?? "http://localhost:9090";
process.env.GRAFANA_URL = process.env.GRAFANA_URL ?? "http://localhost:3001";
process.env.TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION ?? "1h";
process.env.REFRESH_TOKEN_EXPIRATION =
	process.env.REFRESH_TOKEN_EXPIRATION ?? "7d";
process.env.JWT_SECRET_KEY =
	process.env.JWT_SECRET_KEY ?? "test-secret-key-for-testing-only";
process.env.EMAIL_HOST = process.env.EMAIL_HOST ?? "localhost";
process.env.EMAIL_PORT = process.env.EMAIL_PORT ?? "587";
process.env.EMAIL_USER = process.env.EMAIL_USER ?? "test@example.com";
process.env.EMAIL_PASS = process.env.EMAIL_PASS ?? "password";
process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? "noreply@example.com";
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "client-id";
process.env.GOOGLE_CLIENT_SECRET =
	process.env.GOOGLE_CLIENT_SECRET ?? "client-secret";
process.env.GOOGLE_REDIRECT_URI =
	process.env.GOOGLE_REDIRECT_URI ??
	"http://localhost:3000/auth/google/callback";

// Allow opting out of docker-heavy suites when Docker is unavailable.
// Default to skipping unless explicitly set to "false" by the runner.
process.env.SKIP_DOCKER_TESTS = process.env.SKIP_DOCKER_TESTS ?? "true";
process.env.SKIP_REDIS = process.env.SKIP_REDIS ?? "true";
console.log("🚀 ~ process.env.SKIP_DOCKER_TESTS:", process.env.SKIP_DOCKER_TESTS);
console.log("🚀 ~ process.env.SKIP_REDIS:", process.env.SKIP_REDIS);

process.env.TOKEN_TEST =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGFkbWluLmNvbSIsIm5hbWUiOiJBZG1pbiIsImlkIjoiZGYwMzJmMTktZmM0Yy00NDA5LTlhYTktMzMyNjRkMmM3YjcxIiwiaWF0IjoxNzM4MjU3NjI0LCJleHAiOjE3Njk3OTM2MjR9.j0pvqjU3Z_BICTo5wFLrkLo7jTvjW6SWbHcGbJ5T6mQ";

vi.mock("pino-http", () => ({
	HttpLogger: {},
	pinoHttp: () => ({
		logger: {
			info: vi.fn(),
			error: vi.fn(),
		},
	}),
}));

vi.mock("pino", () => {
	// biome-ignore lint/suspicious/noExplicitAny: test double shape not important
	const mPino: any = vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}));
	mPino.stdSerializers = {
		req: vi.fn(),
		res: vi.fn(),
		err: vi.fn(),
	};
	return {
		default: mPino,
		multistream: vi.fn(),
		stdSerializers: mPino.stdSerializers,
	};
});

// Mock OpenAI SDK to avoid pulling the real dependency or making network calls
vi.mock("openai", () => {
	class MockCompletions {
		create = vi.fn().mockResolvedValue({
			choices: [
				{
					message: {
						content: "",
						tool_calls: [],
					},
				},
			],
		});
	}

	class MockChat {
		completions = new MockCompletions();
	}

	class MockOpenAI {
		chat = new MockChat();
	}

	return { default: MockOpenAI };
});
