import { Injectable } from "@nestjs/common";
import type { FindOptionsOrder, FindOptionsWhere, Repository } from "typeorm";

import type { ContainerEntity } from "@/core/container/entity/container";
import type { IContainerRepository } from "@/core/container/repository/container";
import type {
	ContainerListInput,
	ContainerListOutput,
} from "@/core/container/use-cases/container-list";
import type { ContainerSchema } from "@/infra/database/postgres/schemas/container";
import { TypeORMRepository } from "@/infra/repository/postgres/repository";
import {
	ConvertTypeOrmFilter,
	SearchTypeEnum,
	ValidateDatabaseSortAllowed,
} from "@/utils/decorators";
import type { IEntity } from "@/utils/entity";
import { PaginationUtils } from "@/utils/pagination";

@Injectable()
export class ContainerRepository
	extends TypeORMRepository<Model>
	implements IContainerRepository
{
	constructor(readonly repository: Repository<Model>) {
		super(repository);
	}

	@ConvertTypeOrmFilter<ContainerEntity>([
		{ name: "name", type: SearchTypeEnum.like },
		{ name: "status", type: SearchTypeEnum.equal },
		{ name: "image", type: SearchTypeEnum.like },
	])
	@ValidateDatabaseSortAllowed<ContainerEntity>(
		{ name: "id" },
		{ name: "name" },
		{ name: "status" },
		{ name: "createdAt" },
		{ name: "updatedAt" },
	)
	async paginate(input: ContainerListInput): Promise<ContainerListOutput> {
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

type Model = ContainerSchema & ContainerEntity;
