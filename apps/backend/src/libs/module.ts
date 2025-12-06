import { Module } from "@nestjs/common";

import { EventLibModule } from "./event";
import { ExecutorModule } from "./executor";
import { I18nLibModule } from "./i18n";
import { LLMModule } from "./llm";
import { MetricsLibModule } from "./metrics";
import { TokenLibModule } from "./token";

@Module({
	imports: [
		TokenLibModule,
		EventLibModule,
		I18nLibModule,
		MetricsLibModule,
		LLMModule,
		ExecutorModule,
	],
})
export class LibModule {}
