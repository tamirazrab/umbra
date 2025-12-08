import type { FlowRepository } from "@/core/domain/repositories";
import type { FlowOverview } from "@/core/domain/types";

export interface IGetFlowsUseCase {
  execute(): Promise<FlowOverview[]>;
}

/**
 * Use case for retrieving all flows (overview only)
 */
export class GetFlowsUseCase implements IGetFlowsUseCase {
  constructor(private readonly flowRepository: FlowRepository) {}

  async execute(): Promise<FlowOverview[]> {
    return this.flowRepository.findAll();
  }
}
