import type { Flow } from "@/core/domain/entities";
import type { CreateFlowInput, FlowOverview } from "@/core/domain/types";
import { container } from "@/infrastructure/di";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys for cache management
export const flowKeys = {
  all: ["flows"] as const,
  lists: () => [...flowKeys.all, "list"] as const,
  list: (filters: string) => [...flowKeys.lists(), { filters }] as const,
  details: () => [...flowKeys.all, "detail"] as const,
  detail: (id: number) => [...flowKeys.details(), id] as const,
};

/**
 * Hook to fetch all flows (overview only)
 */
export function useFlows() {
  return useQuery<FlowOverview[], Error>({
    queryKey: flowKeys.lists(),
    queryFn: () => container.getGetFlowsUseCase().execute(),
  });
}

/**
 * Hook to fetch a single flow by ID with full details
 */
export function useFlow(id: number | null) {
  return useQuery<Flow | null, Error>({
    queryKey: flowKeys.detail(id!),
    queryFn: () => container.getGetFlowByIdUseCase().execute(id!),
    enabled: id !== null && id > 0,
  });
}

/**
 * Hook to create a new flow
 */
export function useCreateFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFlowInput) =>
      container.getCreateFlowUseCase().execute(input),
    onSuccess: () => {
      // Invalidate flows list to refetch
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
    },
  });
}

/**
 * Hook to finish/stop a flow
 */
export function useFinishFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => container.getFinishFlowUseCase().execute(id),
    onSuccess: (_, id) => {
      // Invalidate both the list and the specific flow
      queryClient.invalidateQueries({ queryKey: flowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: flowKeys.detail(id) });
    },
  });
}
