import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import { TaskEntity } from "../entity/task";
import type { ITaskRepository } from "../repository/task";

export const TaskUpdateResultsSchema = InputValidator.object({
	id: InputValidator.string().uuid(),
	results: InputValidator.string(),
});

export class TaskUpdateResultsUsecase implements IUsecase {
	constructor(
		private readonly taskRepository: ITaskRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(TaskUpdateResultsSchema)
	async execute(
		input: TaskUpdateResultsInput,
		{ tracing, user }: ApiTracingInput,
	): Promise<TaskUpdateResultsOutput> {
		const task = await this.taskRepository.findOne({ id: input.id });

		if (!task) {
			throw new ApiNotFoundException("taskNotFound");
		}

		const updatedTask = new TaskEntity({
			...task,
			results: input.results,
			updatedAt: new Date(),
		});

		await this.taskRepository.updateOne(
			{ id: input.id },
			updatedTask,
		);

		this.loggerService.info({
			message: "task results updated successfully",
			obj: { task: updatedTask as TaskEntity },
		});

		tracing.logEvent("task-results-updated", `task: ${input.id} results updated by: ${user.email}`);

		const updated = await this.taskRepository.findById(input.id);

    tracing.logEvent('task-results-updated', `task results updated by: ${user.email}`);

    return new TaskEntity(updated as TaskEntity);
	}
}

export type TaskUpdateResultsInput = Infer<typeof TaskUpdateResultsSchema>;
export type TaskUpdateResultsOutput = TaskEntity;
