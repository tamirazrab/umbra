import type { FlowEntity } from "@/core/flow/entity/flow";
import type { TaskEntity } from "@/core/task/entity/task";
import type { FlowId, TaskId } from "@/utils/types";

export abstract class IExecutorRepository {
	abstract getFlow(id: FlowId): Promise<FlowEntity | null>;
	abstract getTasks(flowId: FlowId): Promise<TaskEntity[]>;
	abstract createTask(task: Partial<TaskEntity>): Promise<TaskEntity>;
	abstract updateTaskStatus(id: TaskId, status: string): Promise<void>;
	abstract updateTaskResults(id: TaskId, results: string): Promise<void>;
	abstract finishFlow(id: FlowId): Promise<void>;
}
