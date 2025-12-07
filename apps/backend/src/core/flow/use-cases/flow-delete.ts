import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import type { IFlowRepository } from "../repository/flow";

export const FlowDeleteSchema = InputValidator.object({
	id: InputValidator.string().regex(
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
	),
});

export class FlowDeleteUsecase implements IUsecase {
	constructor(
		private readonly flowRepository: IFlowRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(FlowDeleteSchema)
	async execute(
		input: FlowDeleteInput,
		{ tracing }: ApiTracingInput,
	): Promise<FlowDeleteOutput> {
		const flow = await this.flowRepository.findOne({ id: input.id });

		if (!flow) {
			throw new ApiNotFoundException("flowNotFound");
		}

		await this.flowRepository.remove({ id: input.id });

		this.loggerService.info({
			message: "flow deleted successfully",
			obj: { id: input.id },
		});

		tracing.logEvent("flow-deleted", `flow: ${input.id} deleted`);
	}
}

export type FlowDeleteInput = Infer<typeof FlowDeleteSchema>;
export type FlowDeleteOutput = undefined;
