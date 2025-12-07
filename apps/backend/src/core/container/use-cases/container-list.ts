import { ValidateSchema } from "@/utils/decorators";
import {
	type PaginationInput,
	type PaginationOutput,
	PaginationSchema,
} from "@/utils/pagination";
import { SearchSchema } from "@/utils/search";
import { SortSchema } from "@/utils/sort";
import type { IUsecase } from "@/utils/usecase";
import { InputValidator } from "@/utils/validator";

import type { ContainerEntity } from "../entity/container";
import type { IContainerRepository } from "../repository/container";

export const ContainerListSchema = InputValidator.intersection(
	PaginationSchema,
	SortSchema.merge(SearchSchema),
);

export class ContainerListUsecase implements IUsecase {
	constructor(private readonly containerRepository: IContainerRepository) {}

	@ValidateSchema(ContainerListSchema)
	async execute(input: ContainerListInput): Promise<ContainerListOutput> {
		return await this.containerRepository.paginate(input);
	}
}

export type ContainerListInput = PaginationInput<ContainerEntity>;
export type ContainerListOutput = PaginationOutput<ContainerEntity>;
