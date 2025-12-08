import { TaskStatus, TaskType } from "@/core/domain/types";
import { RestTaskRepository } from "@/infrastructure/repositories/rest-task.repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the apiClient
vi.mock("@/infrastructure/api", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { apiClient } from "@/infrastructure/api";

describe("RestTaskRepository", () => {
  let repository: RestTaskRepository;

  beforeEach(() => {
    repository = new RestTaskRepository();
    vi.clearAllMocks();
  });

  describe("findByFlowId", () => {
    it("should fetch and return tasks for a flow", async () => {
      const mockResponse = {
        data: [
          {
            id: 1,
            type: TaskType.Ask,
            message: "Hello",
            status: TaskStatus.Finished,
            args: {},
            results: {},
            flowId: 1,
            createdAt: "2024-01-01T00:00:00Z",
          },
          {
            id: 2,
            type: TaskType.Code,
            message: "Running code",
            status: TaskStatus.InProgress,
            args: { language: "python" },
            results: {},
            flowId: 1,
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await repository.findByFlowId(1);

      expect(apiClient.get).toHaveBeenCalledWith("/v1/flows/1/tasks");
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(TaskType.Ask);
      expect(result[1].type).toBe(TaskType.Code);
    });

    it("should return empty array when no tasks", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      const result = await repository.findByFlowId(1);

      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    it("should fetch and return task entity", async () => {
      const mockResponse = {
        id: 1,
        type: TaskType.Terminal,
        message: "Running command",
        status: TaskStatus.Finished,
        args: { command: "ls -la" },
        results: { output: "file1\nfile2" },
        flowId: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await repository.findById(1);

      expect(apiClient.get).toHaveBeenCalledWith("/v1/tasks/1");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
      expect(result?.type).toBe(TaskType.Terminal);
    });

    it("should return null when task not found", async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error("Not found"));

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create and return new task", async () => {
      const mockResponse = {
        id: 1,
        type: TaskType.Ask,
        message: "User query",
        status: TaskStatus.InProgress,
        args: {},
        results: {},
        flowId: 1,
        createdAt: "2024-01-01T00:00:00Z",
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await repository.create({
        flowId: 1,
        query: "User query",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/v1/tasks", {
        flowId: 1,
        query: "User query",
      });
      expect(result.id).toBe("1");
      expect(result.status).toBe(TaskStatus.InProgress);
    });
  });
});
