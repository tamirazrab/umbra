import { Global, Module } from "@nestjs/common";

import { ITemplateService } from "./adapter";
import { TemplateService } from "./service";

@Global()
@Module({
	providers: [
		{
			provide: ITemplateService,
			useClass: TemplateService,
		},
	],
	exports: [ITemplateService],
})
export class TemplateModule {}
