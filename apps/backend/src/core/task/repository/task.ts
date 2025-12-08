import { IRepository } from "@/infra/repository";

import type { TaskEntity } from "../entity/task";
import type { TaskListInput, TaskListOutput } from "../use-cases/task-list";

export abstract class ITaskRepository extends IRepository<TaskEntity> {
	abstract paginate(input: TaskListInput): Promise<TaskListOutput>;
}
