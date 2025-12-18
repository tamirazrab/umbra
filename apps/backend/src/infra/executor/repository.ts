import { Injectable } from "@nestjs/common";

import type { ContainerEntity } from "@/core/container/entity/container";
import type { FlowEntity } from "@/core/flow/entity/flow";
import type { TaskEntity, TaskStatus } from "@/core/task/entity/task";
import type { TaskCreateInput } from "@/core/task/use-cases/task-create";
import type { IExecutorRepository } from "@/libs/executor/adapter";
import type {
	IContainerGetByIdAdapter
} from "@/modules/container/adapter";
import type {
	IFlowFinishAdapter,
	IFlowGetByIdAdapter,
	IFlowUpdateAdapter,
} from "@/modules/flow/adapter";
import type {
	ITaskCreateAdapter,
	ITaskFindByFlowAdapter,
	ITaskGetByIdAdapter,
	ITaskUpdateAdapter,
	ITaskUpdateResultsAdapter,
	ITaskUpdateStatusAdapter,
} from "@/modules/task/adapter";
import type { ApiTracingInput } from "@/utils/request";
import type { FlowId, TaskId } from "@/utils/types";

@Injectable()
export class ExecutorRepository implements IExecutorRepository {
	constructor(
		private flowGetByIdUsecase: IFlowGetByIdAdapter,
		private flowFinishUsecase: IFlowFinishAdapter,
		private flowUpdateUsecase: IFlowUpdateAdapter,
		private taskCreateUsecase: ITaskCreateAdapter,
		private taskGetByIdUsecase: ITaskGetByIdAdapter,
		private taskFindByFlowUsecase: ITaskFindByFlowAdapter,
		private taskUpdateStatusUsecase: ITaskUpdateStatusAdapter,
		private taskUpdateResultsUsecase: ITaskUpdateResultsAdapter,
		private taskUpdateUsecase: ITaskUpdateAdapter,
		private containerGetByIdUsecase: IContainerGetByIdAdapter,
	) {}

	async getFlow(id: FlowId): Promise<FlowEntity | null> {
		try {
			// FlowGetByIdInput expects UUID string, but FlowId is number
			// Convert number to UUID string format (this is a workaround)
			// In production, FlowId should match FlowEntity.id type
			return await this.flowGetByIdUsecase.execute({
				id: String(id),
			} as { id: string });
		} catch {
			return null;
		}
	}

	async getTasks(flowId: FlowId): Promise<TaskEntity[]> {
		const result = await this.taskFindByFlowUsecase.execute({
			flowId: Number(flowId),
		});
		return result.tasks || result;
	}

	async createTask(
		task: Partial<TaskEntity>,
		trace: ApiTracingInput,
	): Promise<TaskEntity> {
		const created = await this.taskCreateUsecase.execute(task as TaskCreateInput, trace);
		const taskEntity = await this.taskGetByIdUsecase.execute({ id: created.id });
		return taskEntity;
	}

	async updateTaskStatus(
		id: TaskId,
		status: TaskStatus,
		tracing: ApiTracingInput,
	): Promise<void> {
		// TaskUpdateStatusInput expects number, but TaskId can be UUID string
		// Convert if needed
		const taskId = typeof id === "string" ? Number(id) || 0 : id;
		await this.taskUpdateStatusUsecase.execute(
			{ id: taskId, status: status as string },
			tracing,
		);
	}

	async updateTaskResults(
		id: TaskId,
		results: string,
		tracing: ApiTracingInput,
	): Promise<void> {
		// TaskUpdateResultsInput expects UUID string
		const taskId = typeof id === "string" ? id : String(id);
		await this.taskUpdateResultsUsecase.execute(
			{ id: taskId, results },
			tracing,
		);
	}

	async updateTaskToolCallId(
		id: TaskId,
		toolCallId: string | null,
		tracing: ApiTracingInput,
	): Promise<void> {
		// TaskUpdateInput expects UUID string
		const taskId = typeof id === "string" ? id : String(id);
		await this.taskUpdateUsecase.execute(
			{ id: taskId, toolCallId },
			tracing,
		);
	}

	async finishFlow(id: FlowId, tracing: ApiTracingInput): Promise<void> {
		// FlowFinishInput expects UUID string
		await this.flowFinishUsecase.execute({ id: String(id) } as { id: string }, tracing);
	}

	async updateFlowName(
		id: FlowId,
		name: string,
		tracing: ApiTracingInput,
	): Promise<FlowEntity> {
		// FlowUpdateInput expects UUID string
		return await this.flowUpdateUsecase.execute(
			{ id: String(id), name } as { id: string; name: string },
			tracing,
		);
	}

	async updateFlowContainer(
		id: FlowId,
		containerId: number,
		tracing: ApiTracingInput,
	): Promise<FlowEntity> {
		// FlowUpdateInput expects UUID string
		return await this.flowUpdateUsecase.execute(
			{ id: String(id), containerId } as { id: string; containerId: number },
			tracing,
		);
	}

	async getContainerById(id: number): Promise<ContainerEntity | null> {
		try {
			return await this.containerGetByIdUsecase.execute({ id });
		} catch {
			return null;
		}
	}
}
