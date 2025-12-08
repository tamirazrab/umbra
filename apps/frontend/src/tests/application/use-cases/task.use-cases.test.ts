import { CreateTaskUseCase, GetTasksByFlowUseCase } from "@/core/application/use-cases/task";
import { Task } from "@/core/domain/entities/task.entity";
import type { TaskRepository } from "@/core/domain/repositories";
import { TaskStatus, TaskType } from "@/core/domain/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Task Use Cases", () => {
  const createMockTask = (id: string, flowId: string = "1"): Task => {
    return new Task(
      id,
      TaskType.Ask,
      `Task ${id}`,
      TaskStatus.InProgress,
      {},
      {},
      flowId
    );
  };

  describe("CreateTaskUseCase", () => {
    let mockRepository: TaskRepository;
    let useCase: CreateTaskUseCase;

    beforeEach(() => {
      mockRepository = {
        findByFlowId: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
      };
      useCase = new CreateTaskUseCase(mockRepository);
    });

    it("should create and return new task", async () => {
      const input = { flowId: 1, query: "Test query" };
      const createdTask = createMockTask("1");
      vi.mocked(mockRepository.create).mockResolvedValue(createdTask);

      const result = await useCase.execute(input);

      expect(result).toEqual(createdTask);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe("GetTasksByFlowUseCase", () => {
    let mockRepository: TaskRepository;
    let useCase: GetTasksByFlowUseCase;

    beforeEach(() => {
      mockRepository = {
        findByFlowId: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
      };
      useCase = new GetTasksByFlowUseCase(mockRepository);
    });

    it("should return tasks for a flow", async () => {
      const mockTasks = [createMockTask("1"), createMockTask("2")];
      vi.mocked(mockRepository.findByFlowId).mockResolvedValue(mockTasks);

      const result = await useCase.execute(1);

      expect(result).toHaveLength(2);
      expect(mockRepository.findByFlowId).toHaveBeenCalledWith(1);
    });

    it("should return empty array when no tasks", async () => {
      vi.mocked(mockRepository.findByFlowId).mockResolvedValue([]);

      const result = await useCase.execute(1);

      expect(result).toEqual([]);
    });
  });
});
