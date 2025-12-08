import { vi } from "vitest";

process.env.NODE_ENV = "test";
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
	const mPino = vi.fn(() => ({
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	}));
	// @ts-expect-error
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
