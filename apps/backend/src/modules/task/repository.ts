import { Injectable } from "@nestjs/common";
import type { FindOptionsOrder, FindOptionsWhere, Repository } from "typeorm";

import type { TaskEntity } from "@/core/task/entity/task";
import type { ITaskRepository } from "@/core/task/repository/task";
import type {
	TaskListInput,
	TaskListOutput,
} from "@/core/task/use-cases/task-list";
import type { TaskSchema } from "@/infra/database/postgres/schemas/task";
import { TypeORMRepository } from "@/infra/repository/postgres/repository";
import {
	ConvertTypeOrmFilter,
	SearchTypeEnum,
	ValidateDatabaseSortAllowed,
} from "@/utils/decorators";
import type { IEntity } from "@/utils/entity";
import { PaginationUtils } from "@/utils/pagination";

@Injectable()
export class TaskRepository
	extends TypeORMRepository<Model>
	implements ITaskRepository
{
	constructor(readonly repository: Repository<Model>) {
		super(repository);
	}

	@ConvertTypeOrmFilter<TaskEntity>([
		{ name: "type", type: SearchTypeEnum.equal },
		{ name: "status", type: SearchTypeEnum.equal },
		{ name: "toolCallId", type: SearchTypeEnum.equal },
		{ name: "flowId", type: SearchTypeEnum.equal },
	])
	@ValidateDatabaseSortAllowed<TaskEntity>(
		{ name: "id" },
		{ name: "type" },
		{ name: "status" },
		{ name: "createdAt" },
		{ name: "updatedAt" },
	)
	async paginate(input: TaskListInput): Promise<TaskListOutput> {
		const skip = PaginationUtils.calculateSkip(input);

		const [docs, total] = await this.repository.findAndCount({
			take: input.limit,
			skip,
			order: input.sort as FindOptionsOrder<Model>,
			where: input.search as FindOptionsWhere<Model>,
		});

		return { docs, total, page: input.page, limit: input.limit };
	}
}

type Model = TaskSchema & TaskEntity;
