import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import type { FlowEntity } from "../entity/flow";
import type { IFlowRepository } from "../repository/flow";

export const FlowGetByIdSchema = InputValidator.object({
	id: InputValidator.string().regex(
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
	),
});

export class FlowGetByIdUsecase implements IUsecase {
	constructor(private readonly flowRepository: IFlowRepository) {}

	@ValidateSchema(FlowGetByIdSchema)
	async execute(input: FlowGetByIdInput): Promise<FlowGetByIdOutput> {
		const flow = await this.flowRepository.findOne({ id: input.id });

		if (!flow) {
			throw new ApiNotFoundException("flowNotFound");
		}

		return flow;
	}
}

export type FlowGetByIdInput = Infer<typeof FlowGetByIdSchema>;
export type FlowGetByIdOutput = FlowEntity;
