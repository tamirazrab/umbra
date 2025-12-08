import { Injectable } from "@nestjs/common";
import type { FindOptionsOrder, FindOptionsWhere, Repository } from "typeorm";

import type { FlowEntity } from "@/core/flow/entity/flow";
import type { IFlowRepository } from "@/core/flow/repository/flow";
import type {
	FlowListInput,
	FlowListOutput,
} from "@/core/flow/use-cases/flow-list";
import type { FlowSchema } from "@/infra/database/postgres/schemas/flow";
import { TypeORMRepository } from "@/infra/repository/postgres/repository";
import {
	ConvertTypeOrmFilter,
	SearchTypeEnum,
	ValidateDatabaseSortAllowed,
} from "@/utils/decorators";
import type { IEntity } from "@/utils/entity";
import { PaginationUtils } from "@/utils/pagination";

@Injectable()
export class FlowRepository
	extends TypeORMRepository<Model>
	implements IFlowRepository
{
	constructor(readonly repository: Repository<Model>) {
		super(repository);
	}

	@ConvertTypeOrmFilter<FlowEntity>([
		{ name: "name", type: SearchTypeEnum.like },
		{ name: "status", type: SearchTypeEnum.equal },
		{ name: "model", type: SearchTypeEnum.like },
		{ name: "modelProvider", type: SearchTypeEnum.like },
		{ name: "containerId", type: SearchTypeEnum.equal },
	])
	@ValidateDatabaseSortAllowed<FlowEntity>(
		{ name: "id" },
		{ name: "name" },
		{ name: "status" },
		{ name: "createdAt" },
		{ name: "updatedAt" },
	)
	async paginate(input: FlowListInput): Promise<FlowListOutput> {
		const skip = PaginationUtils.calculateSkip(input);

		const [docs, total] = await this.repository.findAndCount({
			take: input.limit,
			skip,
			order: input.sort as FindOptionsOrder<IEntity>,
			where: input.search as FindOptionsWhere<IEntity>,
		});

		return { docs, total, page: input.page, limit: input.limit };
	}
}

type Model = FlowSchema & FlowEntity;
