import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { ILLMProvider } from "../adapter";
import { OllamaProvider } from "./ollama.provider";
import { OpenAIProvider } from "./openai.provider";

type ProviderType = "openai" | "ollama";

@Injectable()
export class ProviderFactory {
	private readonly logger = new Logger(ProviderFactory.name);

	constructor(
		private configService: ConfigService,
		private openaiProvider: OpenAIProvider,
		private ollamaProvider: OllamaProvider,
	) {}

	getProvider(): ILLMProvider {
		const providerType = this.configService.get<ProviderType>(
			"app.providers.type",
			"openai",
		);

		switch (providerType) {
			case "openai":
				return this.openaiProvider;
			case "ollama":
				return this.ollamaProvider;
			default:
				this.logger.warn(
					`Unknown provider type: ${providerType}, defaulting to OpenAI`,
				);
				return this.openaiProvider;
		}
	}
}
