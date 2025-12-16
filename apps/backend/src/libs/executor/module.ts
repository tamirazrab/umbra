import { Global, Module } from "@nestjs/common";

import { EventLibModule } from "../event";
import { ProcessorService } from "./processor.service";
import { QueueService } from "./queue.service";

@Global()
@Module({
	imports: [EventLibModule],
	providers: [QueueService, ProcessorService],
	exports: [QueueService, ProcessorService],
})
export class ExecutorModule {}
