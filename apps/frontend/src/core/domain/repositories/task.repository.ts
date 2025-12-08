import type { Task } from "@/core/domain/entities/task.entity";
import type { CreateTaskInput } from "@/core/domain/types";

/**
 * Repository interface for Task data access
 */
export interface TaskRepository {
  /**
   * Get all tasks for a flow
   */
  findByFlowId(flowId: number): Promise<Task[]>;

  /**
   * Get a task by ID
   */
  findById(id: number): Promise<Task | null>;

  /**
   * Create a new task
   */
  create(input: CreateTaskInput): Promise<Task>;
}
