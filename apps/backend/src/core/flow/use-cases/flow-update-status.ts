import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import { FlowEntity, type FlowStatus } from "../entity/flow";
import type { IFlowRepository } from "../repository/flow";

export const FlowUpdateStatusSchema = InputValidator.object({
	id: InputValidator.string().regex(
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
	),
	status: InputValidator.enum(["in_progress", "finished"]),
});

export class FlowUpdateStatusUsecase implements IUsecase {
	constructor(
		private readonly flowRepository: IFlowRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(FlowUpdateStatusSchema)
	async execute(
		input: FlowUpdateStatusInput,
		{ tracing }: ApiTracingInput,
	): Promise<FlowUpdateStatusOutput> {
		const flow = await this.flowRepository.findOne({ id: input.id });

		if (!flow) {
			throw new ApiNotFoundException("flowNotFound");
		}

		const updatedFlow = new FlowEntity({
			...flow,
			status: input.status as FlowStatus,
			updatedAt: new Date(),
		});

		const result = await this.flowRepository.updateOne(
			{ id: input.id },
			updatedFlow,
		);

		this.loggerService.info({
			message: "flow status updated successfully",
			obj: { id: input.id, status: input.status },
		});

		tracing.logEvent(
			"flow-status-updated",
			`flow: ${input.id} status: ${input.status}`,
		);

		return result;
	}
}

export type FlowUpdateStatusInput = Infer<typeof FlowUpdateStatusSchema>;
export type FlowUpdateStatusOutput = FlowEntity;
