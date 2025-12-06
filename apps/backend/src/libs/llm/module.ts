import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ILLMProvider } from "./adapter";
import { OpenAIProvider } from "./providers/openai.provider";
import { ProviderFactory } from "./providers/provider.factory";

@Global()
@Module({
	imports: [ConfigModule],
	providers: [
		OpenAIProvider,
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
