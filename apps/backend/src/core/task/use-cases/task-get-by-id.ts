import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import type { TaskEntity } from "../entity/task";
import type { ITaskRepository } from "../repository/task";

export const TaskGetByIdSchema = InputValidator.object({
	id: InputValidator.string().uuid(),
});

export class TaskGetByIdUsecase implements IUsecase {
	constructor(private readonly taskRepository: ITaskRepository) {}

	@ValidateSchema(TaskGetByIdSchema)
	async execute(input: TaskGetByIdInput): Promise<TaskGetByIdOutput> {
		const task = await this.taskRepository.findOne({ id: input.id });

		if (!task) {
			throw new ApiNotFoundException("taskNotFound");
		}

		return task;
	}
}

export type TaskGetByIdInput = Infer<typeof TaskGetByIdSchema>;
export type TaskGetByIdOutput = TaskEntity;
