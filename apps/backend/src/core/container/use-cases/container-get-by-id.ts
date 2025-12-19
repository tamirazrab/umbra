import { ValidateSchema } from "@/utils/decorators";
import { ApiNotFoundException } from "@/utils/exception";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import type { ContainerEntity } from "../entity/container";
import type { IContainerRepository } from "../repository/container";

export const ContainerGetByIdSchema = InputValidator.object({
	id: InputValidator.string(),
});

export class ContainerGetByIdUsecase implements IUsecase {
	constructor(private readonly containerRepository: IContainerRepository) {}

	@ValidateSchema(ContainerGetByIdSchema)
	async execute(input: ContainerGetByIdInput): Promise<ContainerGetByIdOutput> {
		const container = await this.containerRepository.findOne({ id: input.id });

		if (!container) {
			throw new ApiNotFoundException("containerNotFound");
		}

		return container;
	}
}

export type ContainerGetByIdInput = Infer<typeof ContainerGetByIdSchema>;
export type ContainerGetByIdOutput = ContainerEntity;
