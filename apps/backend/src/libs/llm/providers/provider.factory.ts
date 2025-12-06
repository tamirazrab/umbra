import { Injectable } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";

import type { ILLMProvider } from "../adapter";
import type { OpenAIProvider } from "./openai.provider";

@Injectable()
export class ProviderFactory {
	constructor(
		_configService: ConfigService,
		private openaiProvider: OpenAIProvider,
	) {}

	getProvider(): ILLMProvider {
		// Currently only supports OpenAI, but can be extended
		return this.openaiProvider;
	}
}
