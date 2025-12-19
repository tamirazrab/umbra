import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { TemplateModule } from "@/libs/template/module";

import { ILLMProvider } from "./adapter";
import { OllamaProvider } from "./providers/ollama.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { ProviderFactory } from "./providers/provider.factory";

@Global()
@Module({
	imports: [ConfigModule, TemplateModule],
	providers: [
		OpenAIProvider,
		OllamaProvider,
		ProviderFactory,
		{
			provide: ILLMProvider,
			useFactory: (factory: ProviderFactory) => factory.getProvider(),
			inject: [ProviderFactory],
		},
	],
	exports: [ILLMProvider, ProviderFactory],
})
export class LLMModule {}
