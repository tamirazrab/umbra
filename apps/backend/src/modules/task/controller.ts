import {
	Controller,
	Delete,
	Get,
	HttpCode,
	Post,
	Put,
	Req,
	Version,
} from "@nestjs/common";

import type {
	TaskCreateInput,
	TaskCreateOutput,
} from "@/core/task/use-cases/task-create";
import type {
	TaskDeleteInput,
	TaskDeleteOutput,
} from "@/core/task/use-cases/task-delete";
import type {
	TaskFindByFlowInput,
	TaskFindByFlowOutput,
} from "@/core/task/use-cases/task-find-by-flow";
import type {
	TaskGetByIdInput,
	TaskGetByIdOutput,
} from "@/core/task/use-cases/task-get-by-id";
import type {
	TaskListInput,
	TaskListOutput,
} from "@/core/task/use-cases/task-list";
import type {
	TaskUpdateInput,
	TaskUpdateOutput,
} from "@/core/task/use-cases/task-update";
import type {
	TaskUpdateResultsInput,
	TaskUpdateResultsOutput,
} from "@/core/task/use-cases/task-update-results";
import type {
	TaskUpdateStatusInput,
	TaskUpdateStatusOutput,
} from "@/core/task/use-cases/task-update-status";
import { Permission } from "@/utils/decorators";
import type { ApiRequest } from "@/utils/request";
import { SearchHttpSchema } from "@/utils/search";
import { SortHttpSchema } from "@/utils/sort";

// biome-ignore lint/style/useImportType: needed for DI
import {
	ITaskCreateAdapter,
	ITaskDeleteAdapter,
	ITaskFindByFlowAdapter,
	ITaskGetByIdAdapter,
	ITaskListAdapter,
	ITaskUpdateAdapter,
	ITaskUpdateResultsAdapter,
	ITaskUpdateStatusAdapter,
} from "./adapter";

@Controller("tasks")
export class TaskController {
	constructor(
		private readonly createUsecase: ITaskCreateAdapter,
		private readonly updateUsecase: ITaskUpdateAdapter,
		private readonly deleteUsecase: ITaskDeleteAdapter,
		private readonly listUsecase: ITaskListAdapter,
		private readonly getByIdUsecase: ITaskGetByIdAdapter,
		private readonly updateStatusUsecase: ITaskUpdateStatusAdapter,
		private readonly updateResultsUsecase: ITaskUpdateResultsAdapter,
		private readonly findByFlowUsecase: ITaskFindByFlowAdapter,
	) {}

	@Post()
	@Version("1")
	@Permission("task:create")
	@HttpCode(201)
	async create(
		@Req() { body, user, tracing }: ApiRequest,
	): Promise<TaskCreateOutput> {
		return this.createUsecase.execute(body as TaskCreateInput, {
			user,
			tracing,
		});
	}

	@Put(":id")
	@Version("1")
	@Permission("task:update")
	async update(
		@Req() { body, user, tracing, params }: ApiRequest,
	): Promise<TaskUpdateOutput> {
		return this.updateUsecase.execute(
			{ ...body, id: Number(params.id) } as TaskUpdateInput,
			{ user, tracing },
		);
	}

	@Put(":id/status")
	@Version("1")
	@Permission("task:update")
	async updateStatus(
		@Req() { body, user, tracing, params }: ApiRequest,
	): Promise<TaskUpdateStatusOutput> {
		return this.updateStatusUsecase.execute(
			{ id: Number(params.id), ...body } as TaskUpdateStatusInput,
			{
				user,
				tracing,
			},
		);
	}

	@Put(":id/results")
	@Version("1")
	@Permission("task:update")
	async updateResults(
		@Req() { body, user, tracing, params }: ApiRequest,
	): Promise<TaskUpdateResultsOutput> {
		return this.updateResultsUsecase.execute(
			{ id: Number(params.id), ...body } as TaskUpdateResultsInput,
			{
				user,
				tracing,
			},
		);
	}

	@Get()
	@Version("1")
	@Permission("task:list")
	async list(@Req() { query }: ApiRequest): Promise<TaskListOutput> {
		const input: TaskListInput = {
			sort: SortHttpSchema.parse(query.sort),
			search: SearchHttpSchema.parse(query.search),
			limit: Number(query.limit),
			page: Number(query.page),
		};

		return await this.listUsecase.execute(input);
	}

	@Get(":id")
	@Version("1")
	@Permission("task:getbyid")
	async getById(@Req() { params }: ApiRequest): Promise<TaskGetByIdOutput> {
		return await this.getByIdUsecase.execute({
			id: String(params.id),
		} as TaskGetByIdInput);
	}

	@Get("flow/:flowId")
	@Version("1")
	@Permission("task:list")
	async findByFlow(
		@Req() { params }: ApiRequest,
	): Promise<TaskFindByFlowOutput> {
		return await this.findByFlowUsecase.execute({
			flowId: String(params.flowId),
		} as TaskFindByFlowInput);
	}

	@Delete(":id")
	@Version("1")
	@Permission("task:delete")
	async delete(
		@Req() { params, user, tracing }: ApiRequest,
	): Promise<TaskDeleteOutput> {
		return await this.deleteUsecase.execute(
			{ id: String(params.id) } as TaskDeleteInput,
			{ user, tracing },
		);
	}
}
