import { Injectable } from "@nestjs/common";
import  { ConfigService } from "@nestjs/config";

import  { ILLMProvider } from "../adapter";
import  { OpenAIProvider } from "./openai.provider";

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
