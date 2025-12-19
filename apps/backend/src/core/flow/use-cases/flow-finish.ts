import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import { FlowEntity, FlowStatus } from "../entity/flow";
import type { IFlowRepository } from "../repository/flow";

export const FlowFinishSchema = InputValidator.object({
	id: InputValidator.string().regex(
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
	),
});

export class FlowFinishUsecase implements IUsecase {
	constructor(
		private readonly flowRepository: IFlowRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(FlowFinishSchema)
	async execute(
		input: FlowFinishInput,
		{ tracing }: ApiTracingInput,
	): Promise<FlowFinishOutput> {
		const flow = await this.flowRepository.findOne({ id: input.id });

		if (!flow) {
			throw new ApiNotFoundException("flowNotFound");
		}

		const finishedFlow = new FlowEntity({
			...flow,
			status: FlowStatus.FINISHED,
			updatedAt: new Date(),
		});

		await this.flowRepository.updateOne(
			{ id: input.id },
			finishedFlow,
		);

		this.loggerService.info({
			message: "flow finished successfully",
			obj: { id: input.id },
		});

		tracing.logEvent("flow-finished", `flow: ${input.id} finished`);

		const updated = await this.flowRepository.findOne({ id: input.id });
		if (!updated) {
			throw new ApiNotFoundException("flowNotFound");
		}
		return updated;
	}
}

export type FlowFinishInput = Infer<typeof FlowFinishSchema>;
export type FlowFinishOutput = FlowEntity;
