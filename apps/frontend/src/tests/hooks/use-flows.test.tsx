import { useCreateFlow, useFinishFlow, useFlow, useFlows } from "@/hooks/use-flows";
import { container } from "@/infrastructure/di";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the container
vi.mock("@/infrastructure/di", () => ({
  container: {
    getGetFlowsUseCase: vi.fn(),
    getGetFlowByIdUseCase: vi.fn(),
    getCreateFlowUseCase: vi.fn(),
    getFinishFlowUseCase: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Flow Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useFlows", () => {
    it("should fetch flows successfully", async () => {
      const mockFlows = [
        { id: 1, name: "Flow 1", status: "inProgress" },
        { id: 2, name: "Flow 2", status: "finished" },
      ];
      vi.mocked(container.getGetFlowsUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue(mockFlows),
      });

      const { result } = renderHook(() => useFlows(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockFlows);
    });

    it("should handle fetch error", async () => {
      vi.mocked(container.getGetFlowsUseCase).mockReturnValue({
        execute: vi.fn().mockRejectedValue(new Error("Failed to fetch")),
      });

      const { result } = renderHook(() => useFlows(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error?.message).toBe("Failed to fetch");
    });

    it("should return empty array when no flows", async () => {
      vi.mocked(container.getGetFlowsUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => useFlows(), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([]);
    });
  });

  describe("useFlow", () => {
    it("should fetch single flow by id", async () => {
      const mockFlow = { id: "1", name: "Test Flow", status: "inProgress" };
      vi.mocked(container.getGetFlowByIdUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue(mockFlow),
      });

      const { result } = renderHook(() => useFlow(1), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockFlow);
    });

    it("should not fetch when id is null", async () => {
      const mockExecute = vi.fn();
      vi.mocked(container.getGetFlowByIdUseCase).mockReturnValue({
        execute: mockExecute,
      });

      const { result } = renderHook(() => useFlow(null), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it("should not fetch when id is 0", async () => {
      const mockExecute = vi.fn();
      vi.mocked(container.getGetFlowByIdUseCase).mockReturnValue({
        execute: mockExecute,
      });

      const { result } = renderHook(() => useFlow(0), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe("idle");
    });

    it("should return null when flow not found", async () => {
      vi.mocked(container.getGetFlowByIdUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue(null),
      });

      const { result } = renderHook(() => useFlow(999), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeNull();
    });
  });

  describe("useCreateFlow", () => {
    it("should create flow successfully", async () => {
      const createdFlow = { id: "1", name: "New Flow", status: "inProgress" };
      vi.mocked(container.getCreateFlowUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue(createdFlow),
      });

      const { result } = renderHook(() => useCreateFlow(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ modelProvider: "openai", modelId: "gpt-4" });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should handle creation error", async () => {
      vi.mocked(container.getCreateFlowUseCase).mockReturnValue({
        execute: vi.fn().mockRejectedValue(new Error("Creation failed")),
      });

      const { result } = renderHook(() => useCreateFlow(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ modelProvider: "openai", modelId: "gpt-4" });
        } catch (e) {
          // Expected error
        }
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useFinishFlow", () => {
    it("should finish flow successfully", async () => {
      const finishedFlow = { id: "1", name: "Test", status: "finished" };
      vi.mocked(container.getFinishFlowUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue(finishedFlow),
      });

      const { result } = renderHook(() => useFinishFlow(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync(1);
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
