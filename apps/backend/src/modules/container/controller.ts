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
	ContainerCreateInput,
	ContainerCreateOutput,
} from "@/core/container/use-cases/container-create";
import type {
	ContainerDeleteInput,
	ContainerDeleteOutput,
} from "@/core/container/use-cases/container-delete";
import type {
	ContainerGetByIdInput,
	ContainerGetByIdOutput,
} from "@/core/container/use-cases/container-get-by-id";
import type {
	ContainerListInput,
	ContainerListOutput,
} from "@/core/container/use-cases/container-list";
import type {
	ContainerUpdateInput,
	ContainerUpdateOutput,
} from "@/core/container/use-cases/container-update";
import type {
	ContainerUpdateStatusInput,
	ContainerUpdateStatusOutput,
} from "@/core/container/use-cases/container-update-status";
import { Permission } from "@/utils/decorators";
import type { ApiRequest } from "@/utils/request";
import { SearchHttpSchema } from "@/utils/search";
import { SortHttpSchema } from "@/utils/sort";

import type {
	IContainerCreateAdapter,
	IContainerDeleteAdapter,
	IContainerGetByIdAdapter,
	IContainerListAdapter,
	IContainerUpdateAdapter,
	IContainerUpdateStatusAdapter,
} from "./adapter";

@Controller("containers")
export class ContainerController {
	constructor(
		private readonly createUsecase: IContainerCreateAdapter,
		private readonly updateUsecase: IContainerUpdateAdapter,
		private readonly deleteUsecase: IContainerDeleteAdapter,
		private readonly listUsecase: IContainerListAdapter,
		private readonly getByIdUsecase: IContainerGetByIdAdapter,
		private readonly updateStatusUsecase: IContainerUpdateStatusAdapter,
	) {}

	@Post()
	@Version("1")
	@Permission("container:create")
	@HttpCode(201)
	async create(
		@Req() { body, user, tracing }: ApiRequest,
	): Promise<ContainerCreateOutput> {
		return this.createUsecase.execute(body as ContainerCreateInput, {
			user,
			tracing,
		});
	}

	@Put(":id")
	@Version("1")
	@Permission("container:update")
	async update(
		@Req() { body, user, tracing, params }: ApiRequest,
	): Promise<ContainerUpdateOutput> {
		return this.updateUsecase.execute(
			{ ...body, id: Number(params.id) } as ContainerUpdateInput,
			{ user, tracing },
		);
	}

	@Put(":id/status")
	@Version("1")
	@Permission("container:update")
	async updateStatus(
		@Req() { body, user, tracing, params }: ApiRequest,
	): Promise<ContainerUpdateStatusOutput> {
		return this.updateStatusUsecase.execute(
			{ id: Number(params.id), ...body } as ContainerUpdateStatusInput,
			{
				user,
				tracing,
			},
		);
	}

	@Get()
	@Version("1")
	@Permission("container:list")
	async list(@Req() { query }: ApiRequest): Promise<ContainerListOutput> {
		const input: ContainerListInput = {
			sort: SortHttpSchema.parse(query.sort),
			search: SearchHttpSchema.parse(query.search),
			limit: Number(query.limit),
			page: Number(query.page),
		};

		return await this.listUsecase.execute(input);
	}

	@Get(":id")
	@Version("1")
	@Permission("container:getbyid")
	async getById(
		@Req() { params }: ApiRequest,
	): Promise<ContainerGetByIdOutput> {
		return await this.getByIdUsecase.execute({
			id: Number(params.id),
		} as ContainerGetByIdInput);
	}

	@Delete(":id")
	@Version("1")
	@Permission("container:delete")
	async delete(
		@Req() { params, user, tracing }: ApiRequest,
	): Promise<ContainerDeleteOutput> {
		return await this.deleteUsecase.execute(
			{ id: Number(params.id) } as ContainerDeleteInput,
			{ user, tracing },
		);
	}
}
