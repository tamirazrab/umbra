import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import type { ITaskRepository } from "../repository/task";

export const TaskDeleteSchema = InputValidator.object({
	id: InputValidator.string().uuid(),
});

export class TaskDeleteUsecase implements IUsecase {
	constructor(
		private readonly taskRepository: ITaskRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(TaskDeleteSchema)
	async execute(
		input: TaskDeleteInput,
		{ tracing }: ApiTracingInput,
	): Promise<TaskDeleteOutput> {
		const task = await this.taskRepository.findOne({ id: input.id });

		if (!task) {
			throw new ApiNotFoundException("taskNotFound");
		}

		await this.taskRepository.remove({ id: input.id });

		this.loggerService.info({
			message: "task deleted successfully",
			obj: { id: input.id },
		});

		tracing.logEvent("task-deleted", `task: ${input.id} deleted`);
	}
}

export type TaskDeleteInput = Infer<typeof TaskDeleteSchema>;
export type TaskDeleteOutput = undefined;
