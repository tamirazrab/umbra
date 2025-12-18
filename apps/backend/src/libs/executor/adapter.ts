import type { ContainerEntity } from "@/core/container/entity/container";
import type { FlowEntity } from "@/core/flow/entity/flow";
import type { TaskEntity, TaskStatus } from "@/core/task/entity/task";
import type { ApiTracingInput } from "@/utils/request";
import type { FlowId, TaskId } from "@/utils/types";

export abstract class IExecutorRepository {
	abstract getFlow(id: FlowId): Promise<FlowEntity | null>;
	abstract getTasks(flowId: FlowId): Promise<TaskEntity[]>;
	abstract createTask(
		task: Partial<TaskEntity>,
		trace: ApiTracingInput,
	): Promise<TaskEntity>;
	abstract updateTaskStatus(
		id: TaskId,
		status: TaskStatus,
		tracing: ApiTracingInput,
	): Promise<void>;
	abstract updateTaskResults(
		id: TaskId,
		results: string,
		tracing: ApiTracingInput,
	): Promise<void>;
	abstract updateTaskToolCallId(
		id: TaskId,
		toolCallId: string | null,
		tracing: ApiTracingInput,
	): Promise<void>;
	abstract finishFlow(id: FlowId, tracing: ApiTracingInput): Promise<void>;
	abstract updateFlowName(
		id: FlowId,
		name: string,
		tracing: ApiTracingInput,
	): Promise<FlowEntity>;
	abstract updateFlowContainer(
		id: FlowId,
		containerId: number,
		tracing: ApiTracingInput,
	): Promise<FlowEntity>;
	abstract getContainerById(id: number): Promise<ContainerEntity | null>;
}
