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

import type { FlowEntity } from "../entity/flow";
import type { IFlowRepository } from "../repository/flow";

export const FlowListSchema = InputValidator.intersection(
	PaginationSchema,
	SortSchema.merge(SearchSchema),
);

export class FlowListUsecase implements IUsecase {
	constructor(private readonly flowRepository: IFlowRepository) {}

	@ValidateSchema(FlowListSchema)
	async execute(input: FlowListInput): Promise<FlowListOutput> {
		return await this.flowRepository.paginate(input);
	}
}

export type FlowListInput = PaginationInput<FlowEntity>;
export type FlowListOutput = PaginationOutput<FlowEntity>;
