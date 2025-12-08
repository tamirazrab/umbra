import { ValidateSchema } from "@/utils/decorators";
import {
	type PaginationInput,
	type PaginationOutput,
	PaginationSchema,
} from "@/utils/pagination";
import { SearchSchema } from "@/utils/search";
import { SortSchema } from "@/utils/sort";
import type { IUsecase } from "@/utils/usecase";
import { InputValidator } from "@/utils/validator";

import type { TaskEntity } from "../entity/task";
import type { ITaskRepository } from "../repository/task";

export const TaskListSchema = InputValidator.intersection(
	PaginationSchema,
	SortSchema.merge(SearchSchema),
);

export class TaskListUsecase implements IUsecase {
	constructor(private readonly taskRepository: ITaskRepository) {}

	@ValidateSchema(TaskListSchema)
	async execute(input: TaskListInput): Promise<TaskListOutput> {
		return await this.taskRepository.paginate(input);
	}
}

export type TaskListInput = PaginationInput<TaskEntity>;
export type TaskListOutput = PaginationOutput<TaskEntity>;
