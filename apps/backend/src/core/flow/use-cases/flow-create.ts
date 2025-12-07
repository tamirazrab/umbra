import type { ILoggerAdapter } from "@/infra/logger";
import type { CreatedModel } from "@/infra/repository";
import { ValidateSchema } from "@/utils/decorators";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import type { Infer } from "@/utils/validator";

import { FlowEntity, FlowEntitySchema, FlowStatus } from "../entity/flow";
import type { IFlowRepository } from "../repository/flow";
import { UUIDUtils } from "@/utils/uuid";

export const FlowCreateSchema = FlowEntitySchema.pick({
	name: true,
	model: true,
	modelProvider: true,
	containerId: true,
}).partial();

export class FlowCreateUsecase implements IUsecase {
	constructor(
		private readonly flowRepository: IFlowRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(FlowCreateSchema)
	async execute(
		input: FlowCreateInput,
		{ tracing }: ApiTracingInput,
	): Promise<FlowCreateOutput> {
		const entity = new FlowEntity({
			id: UUIDUtils.create(),
			name: input.name ?? null,
			status: FlowStatus.IN_PROGRESS,
			model: input.model ?? null,
			modelProvider: input.modelProvider ?? null,
			containerId: input.containerId ?? null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const flow = await this.flowRepository.create(entity);
		console.log("🚀 ~ FlowCreateUsecase ~ execute ~ flow:", flow)

		this.loggerService.info({
			message: "flow created successfully",
			obj: { flow },
		});

		tracing.logEvent("flow-created", `flow: ${flow.id} created`);

		return flow;
	}
}

export type FlowCreateInput = Infer<typeof FlowCreateSchema>;
export type FlowCreateOutput = CreatedModel;
