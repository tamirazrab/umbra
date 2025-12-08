import {
  CreateFlowUseCase,
  FinishFlowUseCase,
  GetFlowByIdUseCase,
  GetFlowsUseCase
} from "@/core/application/use-cases/flow";
import { Flow } from "@/core/domain/entities/flow.entity";
import type { FlowRepository } from "@/core/domain/repositories";
import { FlowStatus } from "@/core/domain/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Flow Use Cases", () => {
  const mockModel = { id: "gpt-4", provider: "openai" };

  const createMockFlow = (id: string, status: FlowStatus = FlowStatus.InProgress): Flow => {
    return new Flow(id, `Flow ${id}`, status, mockModel);
  };

  describe("GetFlowsUseCase", () => {
    let mockRepository: FlowRepository;
    let useCase: GetFlowsUseCase;

    beforeEach(() => {
      mockRepository = {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        finish: vi.fn(),
      };
      useCase = new GetFlowsUseCase(mockRepository);
    });

    it("should return list of flows", async () => {
      const mockFlows = [
        { id: 1, name: "Flow 1", status: FlowStatus.InProgress },
        { id: 2, name: "Flow 2", status: FlowStatus.Finished },
      ];
      vi.mocked(mockRepository.findAll).mockResolvedValue(mockFlows);

      const result = await useCase.execute();

      expect(result).toEqual(mockFlows);
      expect(mockRepository.findAll).toHaveBeenCalledOnce();
    });

    it("should return empty array when no flows", async () => {
      vi.mocked(mockRepository.findAll).mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result).toEqual([]);
    });
  });

  describe("GetFlowByIdUseCase", () => {
    let mockRepository: FlowRepository;
    let useCase: GetFlowByIdUseCase;

    beforeEach(() => {
      mockRepository = {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        finish: vi.fn(),
      };
      useCase = new GetFlowByIdUseCase(mockRepository);
    });

    it("should return flow when found", async () => {
      const mockFlow = createMockFlow("1");
      vi.mocked(mockRepository.findById).mockResolvedValue(mockFlow);

      const result = await useCase.execute(1);

      expect(result).toEqual(mockFlow);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
    });

    it("should return null when flow not found", async () => {
      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await useCase.execute(999);

      expect(result).toBeNull();
    });
  });

  describe("CreateFlowUseCase", () => {
    let mockRepository: FlowRepository;
    let useCase: CreateFlowUseCase;

    beforeEach(() => {
      mockRepository = {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        finish: vi.fn(),
      };
      useCase = new CreateFlowUseCase(mockRepository);
    });

    it("should create and return new flow", async () => {
      const input = { modelProvider: "openai", modelId: "gpt-4" };
      const createdFlow = createMockFlow("1");
      vi.mocked(mockRepository.create).mockResolvedValue(createdFlow);

      const result = await useCase.execute(input);

      expect(result).toEqual(createdFlow);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });
  });

  describe("FinishFlowUseCase", () => {
    let mockRepository: FlowRepository;
    let useCase: FinishFlowUseCase;

    beforeEach(() => {
      mockRepository = {
        findAll: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
        finish: vi.fn(),
      };
      useCase = new FinishFlowUseCase(mockRepository);
    });

    it("should finish flow and return updated flow", async () => {
      const finishedFlow = createMockFlow("1", FlowStatus.Finished);
      vi.mocked(mockRepository.finish).mockResolvedValue(finishedFlow);

      const result = await useCase.execute(1);

      expect(result.status).toBe(FlowStatus.Finished);
      expect(mockRepository.finish).toHaveBeenCalledWith(1);
    });
  });
});
