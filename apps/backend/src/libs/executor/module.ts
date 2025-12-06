import { Global, Module } from "@nestjs/common";

import { ProcessorService } from "./processor.service";
import { QueueService } from "./queue.service";

@Global()
@Module({
	providers: [QueueService, ProcessorService],
	exports: [QueueService, ProcessorService],
})
export class ExecutorModule {}
