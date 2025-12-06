import type { FlowEntity } from "@/core/flow/entity/flow";
import type { TaskEntity } from "@/core/task/entity/task";

export abstract class IExecutorRepository {
	abstract getFlow(id: number): Promise<FlowEntity | null>;
	abstract getTasks(flowId: number): Promise<TaskEntity[]>;
	abstract createTask(task: Partial<TaskEntity>): Promise<TaskEntity>;
	abstract updateTaskStatus(id: number, status: string): Promise<void>;
	abstract updateTaskResults(id: number, results: string): Promise<void>;
	abstract finishFlow(id: number): Promise<void>;
}
