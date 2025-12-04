import { Global, Module } from "@nestjs/common";

import { IExecutorRepository } from "@/libs/executor/adapter";
import { FlowModule } from "@/modules/flow/module";
import { TaskModule } from "@/modules/task/module";

import { ExecutorRepository } from "./repository";

@Global()
@Module({
	imports: [FlowModule, TaskModule],
	providers: [
		{
			provide: IExecutorRepository,
			useClass: ExecutorRepository,
		},
	],
	exports: [IExecutorRepository],
})
export class ExecutorInfraModule {}
