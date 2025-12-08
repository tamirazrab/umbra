import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import { TaskEntity, type TaskStatus } from "../entity/task";
import type { ITaskRepository } from "../repository/task";
import { FlowEntity } from "@/core/flow/entity/flow";

export const TaskUpdateStatusSchema = InputValidator.object({
	id: InputValidator.number().int().positive(),
	status: InputValidator.enum(["in_progress", "finished", "stopped", "failed"]),
});

export class TaskUpdateStatusUsecase implements IUsecase {
	constructor(
		private readonly taskRepository: ITaskRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(TaskUpdateStatusSchema)
	async execute(
		input: TaskUpdateStatusInput,
		{ tracing, user }: ApiTracingInput,
	): Promise<TaskUpdateStatusOutput> {
		const task = await this.taskRepository.findOne({ id: input.id });

		if (!task) {
			throw new ApiNotFoundException("taskNotFound");
		}

		const updatedTask = new TaskEntity({
			...task,
			status: input.status as TaskStatus,
			updatedAt: new Date(),
		});

		await this.taskRepository.updateOne(
			{ id: input.id },
			updatedTask,
		);

		this.loggerService.info({
			message: "task status updated successfully",
			obj: { id: input.id, status: input.status },
		});

		tracing.logEvent(
			"task-status-updated",
			`task: ${input.id} status: ${input.status}`,
		);

		const updated = await this.taskRepository.findById(input.id);

    tracing.logEvent('task-status-updated', `task status updated by: ${user.email}`);

    return new TaskEntity(updated as TaskEntity);
	}
}

export type TaskUpdateStatusInput = Infer<typeof TaskUpdateStatusSchema>;
export type TaskUpdateStatusOutput = TaskEntity;
