import { useCreateTask, useTasksByFlow } from "@/hooks/use-tasks";
import { container } from "@/infrastructure/di";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the container
vi.mock("@/infrastructure/di", () => ({
  container: {
    getGetTasksByFlowUseCase: vi.fn(),
    getCreateTaskUseCase: vi.fn(),
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

describe("Task Hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useTasksByFlow", () => {
    it("should fetch tasks for a flow", async () => {
      const mockTasks = [
        { id: "1", type: "ask", message: "Hello", status: "finished" },
        { id: "2", type: "code", message: "Run code", status: "inProgress" },
      ];
      vi.mocked(container.getGetTasksByFlowUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue(mockTasks),
      });

      const { result } = renderHook(() => useTasksByFlow(1), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockTasks);
    });

    it("should not fetch when flowId is null", async () => {
      const mockExecute = vi.fn();
      vi.mocked(container.getGetTasksByFlowUseCase).mockReturnValue({
        execute: mockExecute,
      });

      const { result } = renderHook(() => useTasksByFlow(null), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it("should not fetch when flowId is 0", async () => {
      const mockExecute = vi.fn();
      vi.mocked(container.getGetTasksByFlowUseCase).mockReturnValue({
        execute: mockExecute,
      });

      const { result } = renderHook(() => useTasksByFlow(0), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe("idle");
    });

    it("should return empty array for flow with no tasks", async () => {
      vi.mocked(container.getGetTasksByFlowUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue([]),
      });

      const { result } = renderHook(() => useTasksByFlow(1), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual([]);
    });

    it("should handle fetch error", async () => {
      vi.mocked(container.getGetTasksByFlowUseCase).mockReturnValue({
        execute: vi.fn().mockRejectedValue(new Error("Network error")),
      });

      const { result } = renderHook(() => useTasksByFlow(1), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe("useCreateTask", () => {
    it("should create task successfully", async () => {
      const createdTask = { id: "1", type: "ask", message: "Hello" };
      vi.mocked(container.getCreateTaskUseCase).mockReturnValue({
        execute: vi.fn().mockResolvedValue(createdTask),
      });

      const { result } = renderHook(() => useCreateTask(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.mutateAsync({ flowId: 1, query: "Hello" });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it("should handle creation error", async () => {
      vi.mocked(container.getCreateTaskUseCase).mockReturnValue({
        execute: vi.fn().mockRejectedValue(new Error("Failed to create task")),
      });

      const { result } = renderHook(() => useCreateTask(), { wrapper: createWrapper() });

      await act(async () => {
        try {
          await result.current.mutateAsync({ flowId: 1, query: "Hello" });
        } catch (e) {
          // Expected
        }
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });
});
