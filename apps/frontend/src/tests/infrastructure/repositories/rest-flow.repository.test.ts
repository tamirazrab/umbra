import { FlowStatus, TaskStatus, TaskType } from "@/core/domain/types";
import { RestFlowRepository } from "@/infrastructure/repositories/rest-flow.repository";
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

describe("RestFlowRepository", () => {
  let repository: RestFlowRepository;

  beforeEach(() => {
    repository = new RestFlowRepository();
    vi.clearAllMocks();
  });

  describe("findAll", () => {
    it("should fetch and return flow overviews", async () => {
      const mockResponse = {
        data: [
          { id: 1, name: "Flow 1", status: FlowStatus.InProgress },
          { id: 2, name: "Flow 2", status: FlowStatus.Finished },
        ],
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await repository.findAll();

      expect(apiClient.get).toHaveBeenCalledWith("/v1/flows");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: "Flow 1",
        status: FlowStatus.InProgress,
      });
    });

    it("should return empty array when no flows", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("findById", () => {
    it("should fetch and return flow entity", async () => {
      const mockResponse = {
        id: 1,
        name: "Test Flow",
        status: FlowStatus.InProgress,
        model: { id: "gpt-4", provider: "openai" },
        tasks: [
          {
            id: 1,
            type: TaskType.Ask,
            message: "Hello",
            status: TaskStatus.Finished,
            args: {},
            results: {},
            createdAt: "2024-01-01T00:00:00Z",
          },
        ],
        terminal: { containerName: "test", connected: true, logs: [] },
        browser: { url: "https://example.com", screenshotUrl: "/screenshot.png" },
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await repository.findById(1);

      expect(apiClient.get).toHaveBeenCalledWith("/v1/flows/1");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
      expect(result?.name).toBe("Test Flow");
      expect(result?.tasks).toHaveLength(1);
    });

    it("should return null when flow not found", async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error("Not found"));

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create and return new flow", async () => {
      const mockResponse = {
        id: 1,
        name: "New Flow",
        status: FlowStatus.InProgress,
        model: { id: "gpt-4", provider: "openai" },
        createdAt: "2024-01-01T00:00:00Z",
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await repository.create({
        modelProvider: "openai",
        modelId: "gpt-4",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/v1/flows", {
        modelProvider: "openai",
        modelId: "gpt-4",
      });
      expect(result.id).toBe("1");
      expect(result.status).toBe(FlowStatus.InProgress);
    });
  });

  describe("finish", () => {
    it("should finish flow and return updated entity", async () => {
      const mockResponse = {
        id: 1,
        name: "Test Flow",
        status: FlowStatus.Finished,
        model: { id: "gpt-4", provider: "openai" },
        updatedAt: "2024-01-01T00:00:00Z",
      };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await repository.finish(1);

      expect(apiClient.put).toHaveBeenCalledWith("/v1/flows/1/finish");
      expect(result.status).toBe(FlowStatus.Finished);
    });
  });
});
