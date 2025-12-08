import type { Flow } from "@/core/domain/entities";
import type { FlowRepository } from "@/core/domain/repositories";

export interface IFinishFlowUseCase {
  execute(id: number): Promise<Flow>;
}

/**
 * Use case for finishing/stopping a flow
 */
export class FinishFlowUseCase implements IFinishFlowUseCase {
  constructor(private readonly flowRepository: FlowRepository) {}

  async execute(id: number): Promise<Flow> {
    return this.flowRepository.finish(id);
  }
}
