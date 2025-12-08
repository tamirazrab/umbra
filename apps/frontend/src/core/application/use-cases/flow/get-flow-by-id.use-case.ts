import type { Flow } from "@/core/domain/entities";
import type { FlowRepository } from "@/core/domain/repositories";

export interface IGetFlowByIdUseCase {
  execute(id: number): Promise<Flow | null>;
}

/**
 * Use case for retrieving a single flow by ID with full details
 */
export class GetFlowByIdUseCase implements IGetFlowByIdUseCase {
  constructor(private readonly flowRepository: FlowRepository) {}

  async execute(id: number): Promise<Flow | null> {
    return this.flowRepository.findById(id);
  }
}
