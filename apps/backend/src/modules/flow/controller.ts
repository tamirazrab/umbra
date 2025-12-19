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
	FlowCreateInput,
	FlowCreateOutput,
} from "@/core/flow/use-cases/flow-create";
import type {
	FlowDeleteInput,
	FlowDeleteOutput,
} from "@/core/flow/use-cases/flow-delete";
import type {
	FlowFinishInput,
	FlowFinishOutput,
} from "@/core/flow/use-cases/flow-finish";
import type {
	FlowGetByIdInput,
	FlowGetByIdOutput,
} from "@/core/flow/use-cases/flow-get-by-id";
import type {
	FlowListInput,
	FlowListOutput,
} from "@/core/flow/use-cases/flow-list";
import type {
	FlowUpdateInput,
	FlowUpdateOutput,
} from "@/core/flow/use-cases/flow-update";
import type {
	FlowUpdateStatusInput,
	FlowUpdateStatusOutput,
} from "@/core/flow/use-cases/flow-update-status";
import { Permission } from "@/utils/decorators";
import type { ApiRequest } from "@/utils/request";
import { SearchHttpSchema } from "@/utils/search";
import { SortHttpSchema } from "@/utils/sort";

// biome-ignore lint/style/useImportType: needed for DI
import {
	IFlowCreateAdapter,
	IFlowDeleteAdapter,
	IFlowFinishAdapter,
	IFlowGetByIdAdapter,
	IFlowListAdapter,
	IFlowUpdateAdapter,
	IFlowUpdateStatusAdapter,
} from "./adapter";

@Controller("flows")
export class FlowController {
	constructor(
		private readonly createUsecase: IFlowCreateAdapter,
		private readonly updateUsecase: IFlowUpdateAdapter,
		private readonly deleteUsecase: IFlowDeleteAdapter,
		private readonly listUsecase: IFlowListAdapter,
		private readonly getByIdUsecase: IFlowGetByIdAdapter,
		private readonly updateStatusUsecase: IFlowUpdateStatusAdapter,
		private readonly finishUsecase: IFlowFinishAdapter,
	) {}

	@Post()
	@Version("1")
	@Permission("flow:create")
	@HttpCode(201)
	async create(
		@Req() { body, user, tracing }: ApiRequest,
	): Promise<FlowCreateOutput> {
		return this.createUsecase.execute(body as FlowCreateInput, {
			user,
			tracing,
		});
	}

	@Put(":id")
	@Version("1")
	@Permission("flow:update")
	async update(
		@Req() { body, user, tracing, params }: ApiRequest,
	): Promise<FlowUpdateOutput> {
		return this.updateUsecase.execute(
			{ ...body, id: String(params.id) } as FlowUpdateInput,
			{ user, tracing },
		);
	}

	@Put(":id/status")
	@Version("1")
	@Permission("flow:update")
	async updateStatus(
		@Req() { body, user, tracing, params }: ApiRequest,
	): Promise<FlowUpdateStatusOutput> {
		return this.updateStatusUsecase.execute(
			{ id: String(params.id), ...body } as FlowUpdateStatusInput,
			{
				user,
				tracing,
			},
		);
	}

	@Put(":id/finish")
	@Version("1")
	@Permission("flow:update")
	async finish(
		@Req() { user, tracing, params }: ApiRequest,
	): Promise<FlowFinishOutput> {
		return this.finishUsecase.execute(
			{ id: String(params.id) } as FlowFinishInput,
			{ user, tracing },
		);
	}

	@Get()
	@Version("1")
	@Permission("flow:list")
	async list(@Req() { query }: ApiRequest): Promise<FlowListOutput> {
		const input: FlowListInput = {
			sort: SortHttpSchema.parse(query.sort),
			search: SearchHttpSchema.parse(query.search),
			limit: Number(query.limit),
			page: Number(query.page),
		};

		return await this.listUsecase.execute(input);
	}

	@Get(":id")
	@Version("1")
	@Permission("flow:getbyid")
	async getById(@Req() { params }: ApiRequest): Promise<FlowGetByIdOutput> {
		return await this.getByIdUsecase.execute({
			id: String(params.id),
		} as FlowGetByIdInput);
	}

	@Delete(":id")
	@Version("1")
	@Permission("flow:delete")
	async delete(
		@Req() { params, user, tracing }: ApiRequest,
	): Promise<FlowDeleteOutput> {
		return await this.deleteUsecase.execute(
			{ id: String(params.id) } as FlowDeleteInput,
			{ user, tracing },
		);
	}
}
