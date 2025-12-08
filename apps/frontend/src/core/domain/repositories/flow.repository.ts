import type { Flow } from "@/core/domain/entities/flow.entity";
import type { CreateFlowInput, FlowOverview } from "@/core/domain/types";

/**
 * Repository interface for Flow data access
 * Implementations can use REST API, GraphQL, or any other data source
 */
export interface FlowRepository {
  /**
   * Get all flows (overview only - no nested tasks/terminal/browser)
   */
  findAll(): Promise<FlowOverview[]>;

  /**
   * Get a flow by ID with full details
   */
  findById(id: number): Promise<Flow | null>;

  /**
   * Create a new flow
   */
  create(input: CreateFlowInput): Promise<Flow>;

  /**
   * Finish/stop a flow
   */
  finish(id: number): Promise<Flow>;
}
