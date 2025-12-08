import type { Task } from "@/core/domain/entities";
import { Task as TaskEntity } from "@/core/domain/entities";
import type { TaskRepository } from "@/core/domain/repositories";
import type { CreateTaskInput, TaskStatus, TaskType } from "@/core/domain/types";
import { apiClient } from "@/infrastructure/api";

/**
 * API response type matching backend DTO
 */
interface TaskApiResponse {
  id: number;
  type: TaskType;
  message: string;
  status: TaskStatus;
  args: Record<string, unknown>;
  results: Record<string, unknown>;
  flowId?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Transform API response to Task entity
 */
function toTaskEntity(data: TaskApiResponse): Task {
  return new TaskEntity(
    data.id.toString(),
    data.type,
    data.message,
    data.status,
    data.args,
    data.results,
    data.flowId?.toString() || null,
    new Date(data.createdAt),
    data.updatedAt ? new Date(data.updatedAt) : undefined
  );
}

/**
 * REST API implementation of TaskRepository
 */
export class RestTaskRepository implements TaskRepository {
  private readonly basePath = "/v1/tasks";

  async findByFlowId(flowId: number): Promise<Task[]> {
    const response = await apiClient.get<{ data: TaskApiResponse[] }>(
      `/v1/flows/${flowId}/tasks`
    );
    return response.data.map(toTaskEntity);
  }

  async findById(id: number): Promise<Task | null> {
    try {
      const response = await apiClient.get<TaskApiResponse>(`${this.basePath}/${id}`);
      return toTaskEntity(response);
    } catch (error) {
      console.error(`Failed to fetch task ${id}:`, error);
      return null;
    }
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const response = await apiClient.post<TaskApiResponse>(this.basePath, {
      flowId: input.flowId,
      query: input.query,
    });
    return toTaskEntity(response);
  }
}
