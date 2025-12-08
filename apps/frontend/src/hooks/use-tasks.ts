import type { Task } from "@/core/domain/entities";
import type { CreateTaskInput } from "@/core/domain/types";
import { container } from "@/infrastructure/di";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flowKeys } from "./use-flows";

// Query keys for cache management
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  listByFlow: (flowId: number) => [...taskKeys.lists(), { flowId }] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
};

/**
 * Hook to fetch all tasks for a flow
 */
export function useTasksByFlow(flowId: number | null) {
  return useQuery<Task[], Error>({
    queryKey: taskKeys.listByFlow(flowId!),
    queryFn: () => container.getGetTasksByFlowUseCase().execute(flowId!),
    enabled: flowId !== null && flowId > 0,
  });
}

/**
 * Hook to create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) =>
      container.getCreateTaskUseCase().execute(input),
    onSuccess: (_, variables) => {
      // Invalidate tasks list for this flow
      queryClient.invalidateQueries({
        queryKey: taskKeys.listByFlow(variables.flowId)
      });
      // Also invalidate the flow detail to update task count
      queryClient.invalidateQueries({
        queryKey: flowKeys.detail(variables.flowId)
      });
    },
  });
}
