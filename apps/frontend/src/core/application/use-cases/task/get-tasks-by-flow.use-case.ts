import type { Task } from "@/core/domain/entities";
import type { TaskRepository } from "@/core/domain/repositories";

export interface IGetTasksByFlowUseCase {
  execute(flowId: number): Promise<Task[]>;
}

/**
 * Use case for getting all tasks in a flow
 */
export class GetTasksByFlowUseCase implements IGetTasksByFlowUseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(flowId: number): Promise<Task[]> {
    return this.taskRepository.findByFlowId(flowId);
  }
}
