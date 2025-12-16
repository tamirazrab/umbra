import { Injectable } from "@nestjs/common";

import  { FlowEntity } from "@/core/flow/entity/flow";
import  { TaskEntity } from "@/core/task/entity/task";
import  { IExecutorRepository } from "@/libs/executor/adapter";
import  {
	IFlowFinishAdapter,
	IFlowGetByIdAdapter,
} from "@/modules/flow/adapter";
import  {
	ITaskCreateAdapter,
	ITaskFindByFlowAdapter,
	ITaskUpdateResultsAdapter,
	ITaskUpdateStatusAdapter,
} from "@/modules/task/adapter";

@Injectable()
export class ExecutorRepository implements IExecutorRepository {
	constructor(
		private flowGetByIdUsecase: IFlowGetByIdAdapter,
		private flowFinishUsecase: IFlowFinishAdapter,
		private taskCreateUsecase: ITaskCreateAdapter,
		private taskFindByFlowUsecase: ITaskFindByFlowAdapter,
		private taskUpdateStatusUsecase: ITaskUpdateStatusAdapter,
		private taskUpdateResultsUsecase: ITaskUpdateResultsAdapter,
	) {}

	async getFlow(id: number): Promise<FlowEntity | null> {
		try {
			return await this.flowGetByIdUsecase.execute(
				{ id },
				{ tracing: "executor" },
			);
		} catch {
			return null;
		}
	}

	async getTasks(flowId: number): Promise<TaskEntity[]> {
		const result = await this.taskFindByFlowUsecase.execute(
			{ flowId },
			{ tracing: "executor" },
		);
		return result.tasks;
	}

	async createTask(task: Partial<TaskEntity>): Promise<TaskEntity> {
		return await this.taskCreateUsecase.execute(task, {
			tracing: "executor",
		});
	}

	async updateTaskStatus(id: number, status: string): Promise<void> {
		await this.taskUpdateStatusUsecase.execute(
			{ id, status },
			{ tracing: "executor" },
		);
	}

	async updateTaskResults(id: number, results: string): Promise<void> {
		await this.taskUpdateResultsUsecase.execute(
			{ id, results },
			{ tracing: "executor" },
		);
	}

	async finishFlow(id: number): Promise<void> {
		await this.flowFinishUsecase.execute({ id }, { tracing: "executor" });
	}
}
