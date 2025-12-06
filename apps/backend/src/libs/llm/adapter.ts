import type { TaskEntity } from "@/core/task/entity/task";

import type { NextTaskOptions } from "./types";

export abstract class ILLMProvider {
	abstract name(): string;
	abstract summary(query: string, maxLength: number): Promise<string>;
	abstract dockerImageName(task: string): Promise<string>;
	abstract nextTask(options: NextTaskOptions): Promise<Partial<TaskEntity>>;
}
