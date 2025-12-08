import type { Flow } from "@/core/domain/entities";
import { Flow as FlowEntity, Task as TaskEntity } from "@/core/domain/entities";
import type { FlowRepository } from "@/core/domain/repositories";
import type { CreateFlowInput, FlowOverview, FlowStatus, TaskStatus, TaskType } from "@/core/domain/types";
import { apiClient } from "@/infrastructure/api";

/**
 * API response types matching backend DTOs
 */
interface FlowApiResponse {
  id: number;
  name: string;
  status: FlowStatus;
  model?: {
    id: string;
    provider: string;
  };
  tasks?: Array<{
    id: number;
    type: TaskType;
    message: string;
    status: TaskStatus;
    args: Record<string, unknown>;
    results: Record<string, unknown>;
    createdAt: string;
  }>;
  terminal?: {
    containerName: string;
    connected: boolean;
    logs: Array<{ id: number; text: string }>;
  };
  browser?: {
    url: string;
    screenshotUrl: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Transform API response to Flow entity
 */
function toFlowEntity(data: FlowApiResponse): Flow {
  const tasks = data.tasks?.map((t) =>
    new TaskEntity(
      t.id.toString(),
      t.type,
      t.message,
      t.status,
      t.args,
      t.results,
      data.id.toString(),
      new Date(t.createdAt)
    )
  ) || [];

  return new FlowEntity(
    data.id.toString(),
    data.name,
    data.status,
    data.model || { id: "", provider: "" },
    tasks,
    data.terminal || null,
    data.browser || null,
    data.createdAt ? new Date(data.createdAt) : undefined,
    data.updatedAt ? new Date(data.updatedAt) : undefined
  );
}

/**
 * REST API implementation of FlowRepository
 */
export class RestFlowRepository implements FlowRepository {
  private readonly basePath = "/v1/flows";

  async findAll(): Promise<FlowOverview[]> {
    const response = await apiClient.get<{ data: FlowApiResponse[] }>(this.basePath);
    return response.data.map((flow) => ({
      id: flow.id,
      name: flow.name,
      status: flow.status,
    }));
  }

  async findById(id: number): Promise<Flow | null> {
    try {
      const response = await apiClient.get<FlowApiResponse>(`${this.basePath}/${id}`);
      return toFlowEntity(response);
    } catch (error) {
      console.error(`Failed to fetch flow ${id}:`, error);
      return null;
    }
  }

  async create(input: CreateFlowInput): Promise<Flow> {
    const response = await apiClient.post<FlowApiResponse>(this.basePath, {
      modelProvider: input.modelProvider,
      modelId: input.modelId,
    });
    return toFlowEntity(response);
  }

  async finish(id: number): Promise<Flow> {
    const response = await apiClient.put<FlowApiResponse>(`${this.basePath}/${id}/finish`);
    return toFlowEntity(response);
  }
}
