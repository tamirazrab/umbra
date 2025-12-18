import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import { TaskEntity, TaskEntitySchema } from "../entity/task";
import type { ITaskRepository } from "../repository/task";

export const TaskUpdateSchema = InputValidator.object({
	id: InputValidator.string(),
}).merge(
	TaskEntitySchema.pick({
		type: true,
		args: true,
		message: true,
		toolCallId: true,
		flowId: true,
	}).partial(),
);

export class TaskUpdateUsecase implements IUsecase {
	constructor(
		private readonly taskRepository: ITaskRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(TaskUpdateSchema)
	async execute(
		input: TaskUpdateInput,
		{ tracing, user }: ApiTracingInput,
	): Promise<TaskUpdateOutput> {
		const task = await this.taskRepository.findById(input.id);

		if (!task) {
			throw new ApiNotFoundException("taskNotFound");
		}

		const entity = new TaskEntity({
			...task,
			...input,
			updatedAt: new Date(),
		});

		await this.taskRepository.updateOne(
			{ id: entity.id },
			entity,
		);

		this.loggerService.info({
			message: "task updated successfully",
			obj: { task: entity as TaskEntity },
		});

		tracing.logEvent("task-updated", `task: ${input.id} updated by: ${user.email}`);

		const updated = await this.taskRepository.findById(entity.id);

		return new TaskEntity(updated as TaskEntity);
	}
}

export type TaskUpdateInput = Infer<typeof TaskUpdateSchema>;
export type TaskUpdateOutput = TaskEntity;
