import type { ILoggerAdapter } from "@/infra/logger";
import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import { ContainerEntity, ContainerEntitySchema } from "../entity/container";
import type { IContainerRepository } from "../repository/container";

export const ContainerUpdateSchema = InputValidator.object({
	id: InputValidator.string().uuid(),
}).merge(
	ContainerEntitySchema.pick({
		name: true,
		localId: true,
		image: true,
		status: true,
	}).partial(),
);

export class ContainerUpdateUsecase implements IUsecase {
	constructor(
		private readonly containerRepository: IContainerRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(ContainerUpdateSchema)
	async execute(
		input: ContainerUpdateInput,
		{ tracing, user }: ApiTracingInput,
	): Promise<ContainerUpdateOutput> {
		const container = await this.containerRepository.findOne({ id: input.id });

		if (!container) {
			throw new ApiNotFoundException("containerNotFound");
		}

		this.loggerService.info({
			message: "container found",
			obj: { container: container },
		});

		const entity = new ContainerEntity({
			...container,
			...input,
			updatedAt: new Date(),
		});

		const updated = (await this.containerRepository.updateOne(
			{ id: entity.id },
			entity,
		)) as unknown as ContainerEntity;

		this.loggerService.info({
			message: "container updated successfully",
			obj: { container: updated },
		});

		tracing.logEvent(
			"container-updated",
			`container updated by: ${user.email}`,
		);

		return new ContainerEntity(updated);
	}
}

export type ContainerUpdateInput = Infer<typeof ContainerUpdateSchema>;
export type ContainerUpdateOutput = ContainerEntity;