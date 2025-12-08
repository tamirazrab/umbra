import type { Task } from "@/core/domain/entities";
import type { TaskRepository } from "@/core/domain/repositories";
import type { CreateTaskInput } from "@/core/domain/types";

export interface ICreateTaskUseCase {
  execute(input: CreateTaskInput): Promise<Task>;
}

/**
 * Use case for creating a new task in a flow
 */
export class CreateTaskUseCase implements ICreateTaskUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    return this.taskRepository.create(input);
  }
}
