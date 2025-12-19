import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { OllamaProvider } from "../ollama.provider";
import { OpenAIProvider } from "../openai.provider";
import { ProviderFactory } from "../provider.factory";

describe(ProviderFactory.name, () => {
	let factory: ProviderFactory;
	let configService: ConfigService;
	let openaiProvider: OpenAIProvider;
	let ollamaProvider: OllamaProvider;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			providers: [
				ProviderFactory,
				{
					provide: ConfigService,
					useValue: {
						get: vi.fn((key: string, defaultValue?: string) => {
							if (key === "app.providers.type") return "openai";
							return defaultValue;
						}),
					},
				},
				{
					provide: OpenAIProvider,
					useValue: {
						name: vi.fn(() => "openai"),
					},
				},
				{
					provide: OllamaProvider,
					useValue: {
						name: vi.fn(() => "ollama"),
					},
				},
			],
		}).compile();

		factory = app.get(ProviderFactory);
		configService = app.get(ConfigService);
		openaiProvider = app.get(OpenAIProvider);
		ollamaProvider = app.get(OllamaProvider);
	});

	describe("getProvider", () => {
		test("should return OpenAI provider by default", () => {
			vi.spyOn(configService, "get").mockReturnValue("openai");

			const provider = factory.getProvider();

			expect(provider).toBe(openaiProvider);
		});

		test("should return OpenAI provider when type is 'openai'", () => {
			vi.spyOn(configService, "get").mockReturnValue("openai");

			const provider = factory.getProvider();

			expect(provider).toBe(openaiProvider);
		});

		test("should return Ollama provider when type is 'ollama'", () => {
			vi.spyOn(configService, "get").mockReturnValue("ollama");

			const provider = factory.getProvider();

			expect(provider).toBe(ollamaProvider);
		});

		test("should default to OpenAI for unknown provider type", () => {
			vi.spyOn(configService, "get").mockReturnValue("unknown");

			const provider = factory.getProvider();

			expect(provider).toBe(openaiProvider);
		});
	});
});

