import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import { ContainerEntity, type ContainerStatus } from "../entity/container";
import type { IContainerRepository } from "../repository/container";

export const ContainerUpdateStatusSchema = InputValidator.object({
	id: InputValidator.string(),
	status: InputValidator.enum(["starting", "running", "stopped", "failed"]),
});

export class ContainerUpdateStatusUsecase implements IUsecase {
	constructor(
		private readonly containerRepository: IContainerRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(ContainerUpdateStatusSchema)
	async execute(
		input: ContainerUpdateStatusInput,
		{ tracing }: ApiTracingInput,
	): Promise<ContainerUpdateStatusOutput> {
		const container = await this.containerRepository.findOne({ id: input.id });

		if (!container) {
			throw new ApiNotFoundException("containerNotFound");
		}

		const updatedContainer = new ContainerEntity({
			...container,
			status: input.status as ContainerStatus,
			updatedAt: new Date(),
		});

		const result = await this.containerRepository.updateOne(
			{ id: input.id },
			updatedContainer,
		);

		this.loggerService.info({
			message: "container status updated successfully",
			obj: { id: input.id, status: input.status },
		});

		tracing.logEvent(
			"container-status-updated",
			`container: ${input.id} status: ${input.status}`,
		);

		return result;
	}
}

export type ContainerUpdateStatusInput = Infer<
	typeof ContainerUpdateStatusSchema
>;
export type ContainerUpdateStatusOutput = ContainerEntity;
