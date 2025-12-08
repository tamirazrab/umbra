import { ValidateSchema } from "@/utils/decorators";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import type { TaskEntity } from "../entity/task";
import type { ITaskRepository } from "../repository/task";

export const TaskFindByFlowSchema = InputValidator.object({
	flowId: InputValidator.number().int().positive(),
});

export class TaskFindByFlowUsecase implements IUsecase {
	constructor(private readonly taskRepository: ITaskRepository) {}

	@ValidateSchema(TaskFindByFlowSchema)
	async execute(input: TaskFindByFlowInput): Promise<TaskFindByFlowOutput> {
		return await this.taskRepository.find({ flowId: input.flowId });
	}
}

export type TaskFindByFlowInput = Infer<typeof TaskFindByFlowSchema>;
export type TaskFindByFlowOutput = TaskEntity[];
