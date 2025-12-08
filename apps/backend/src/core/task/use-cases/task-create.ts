import type { ILoggerAdapter } from "@/infra/logger";
import type { CreatedModel } from "@/infra/repository";
import { ValidateSchema } from "@/utils/decorators";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import type { Infer } from "@/utils/validator";

import {
	TaskEntity,
	TaskEntitySchema,
	TaskStatus,
	type TaskType,
} from "../entity/task";
import type { ITaskRepository } from "../repository/task";
import { UUIDUtils } from "@/utils/uuid";

export const TaskCreateSchema = TaskEntitySchema.pick({
	type: true,
	args: true,
	message: true,
	toolCallId: true,
	flowId: true,
}).partial();

export class TaskCreateUsecase implements IUsecase {
	constructor(
		private readonly taskRepository: ITaskRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(TaskCreateSchema)
	async execute(
		input: TaskCreateInput,
		{ tracing }: ApiTracingInput,
	): Promise<TaskCreateOutput> {
		const entity = new TaskEntity({
			id: UUIDUtils.create(),
			type: (input.type as TaskType) ?? null,
			status: TaskStatus.IN_PROGRESS,
			args: input.args ?? {},
			results: "{}",
			message: input.message ?? null,
			toolCallId: input.toolCallId ?? null,
			flowId: input.flowId ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const task = await this.taskRepository.create(entity);

		this.loggerService.info({
			message: "task created successfully",
			obj: { task },
		});

		tracing.logEvent("task-created", `task: ${task.id} created`);

		return task;
	}
}

export type TaskCreateInput = Infer<typeof TaskCreateSchema>;
export type TaskCreateOutput = CreatedModel;
