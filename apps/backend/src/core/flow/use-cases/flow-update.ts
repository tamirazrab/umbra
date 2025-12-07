import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import { FlowEntity, FlowEntitySchema } from "../entity/flow";
import type { IFlowRepository } from "../repository/flow";

export const FlowUpdateSchema = InputValidator.object({
	id: InputValidator.string().regex(
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
	),
}).merge(
	FlowEntitySchema.pick({
		name: true,
		model: true,
		modelProvider: true,
		status: true,
		containerId: true,
	}).partial(),
);

export class FlowUpdateUsecase implements IUsecase {
	constructor(
		private readonly flowRepository: IFlowRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(FlowUpdateSchema)
	async execute(
		input: FlowUpdateInput,
		{ tracing, user }: ApiTracingInput,
	): Promise<FlowUpdateOutput> {
		const flow = await this.flowRepository.findOne({ id: input.id });

		if (!flow) {
			throw new ApiNotFoundException("flowNotFound");
		}

		this.loggerService.info({
			message: "flow found",
			obj: { flow: flow },
		});

		const entity = new FlowEntity({
			...flow,
			...input,
			updatedAt: new Date(),
		});
		// Persist the updated flow but ignore the low-level database metadata
		await this.flowRepository.updateOne(
			{ id: entity.id },
			entity,
		);

		this.loggerService.info({
			message: "flow updated successfully",
			obj: { flow: entity },
		});

		tracing.logEvent("flow-updated", `flow: ${input.id} updated`);

		const updated = await this.flowRepository.findById(entity.id);

    tracing.logEvent('flow-updated', `flow updated by: ${user.email}`);

    return new FlowEntity(updated as FlowEntity);
	}
}

export type FlowUpdateInput = Infer<typeof FlowUpdateSchema>;
export type FlowUpdateOutput = FlowEntity;
