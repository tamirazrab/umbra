import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import type { IContainerRepository } from "../repository/container";

export const ContainerDeleteSchema = InputValidator.object({
	id: InputValidator.string().uuid(),
});

export class ContainerDeleteUsecase implements IUsecase {
	constructor(
		private readonly containerRepository: IContainerRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(ContainerDeleteSchema)
	async execute(
		input: ContainerDeleteInput,
		{ tracing }: ApiTracingInput,
	): Promise<ContainerDeleteOutput> {
		const container = await this.containerRepository.findOne({ id: input.id });

		if (!container) {
			throw new ApiNotFoundException("containerNotFound");
		}

		await this.containerRepository.remove({ id: input.id });

		this.loggerService.info({
			message: "container deleted successfully",
			obj: { id: input.id },
		});

		tracing.logEvent("container-deleted", `container: ${input.id} deleted`);
	}
}

export type ContainerDeleteInput = Infer<typeof ContainerDeleteSchema>;
export type ContainerDeleteOutput = undefined;
