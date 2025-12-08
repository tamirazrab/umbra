import type { Flow } from "@/core/domain/entities";
import type { FlowRepository } from "@/core/domain/repositories";
import type { CreateFlowInput } from "@/core/domain/types";

export interface ICreateFlowUseCase {
  execute(input: CreateFlowInput): Promise<Flow>;
}

/**
 * Use case for creating a new flow
 */
export class CreateFlowUseCase implements ICreateFlowUseCase {
  constructor(private readonly flowRepository: FlowRepository) {}

  async execute(input: CreateFlowInput): Promise<Flow> {
    return this.flowRepository.create(input);
  }
}
