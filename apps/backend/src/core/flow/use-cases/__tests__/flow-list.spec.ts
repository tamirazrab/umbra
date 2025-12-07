import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { FlowEntity, FlowStatus } from "../../entity/flow";
import { IFlowRepository } from "../../repository/flow";
import { type FlowListInput, FlowListUsecase } from "../flow-list";
import { getUUID, mockResolvedValue } from "@/test/mock";

describe(FlowListUsecase.name, () => {
	let usecase: FlowListUsecase;
	let repository: IFlowRepository;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			imports: [],
			providers: [
				{
					provide: IFlowRepository,
					useValue: {},
				},
				{
					provide: FlowListUsecase,
					useFactory: (flowRepository: IFlowRepository) => {
						return new FlowListUsecase(flowRepository);
					},
					inject: [IFlowRepository],
				},
			],
		}).compile();

		usecase = app.get(FlowListUsecase);
		repository = app.get(IFlowRepository);
	});

	test("should return paginated flows", async () => {
		const flows = [
			new FlowEntity({
				id: getUUID(),
				name: "Flow 1",
				status: FlowStatus.IN_PROGRESS,
				model: "gpt-4",
				modelProvider: "openai",
				containerId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
			new FlowEntity({
				id: getUUID(),
				name: "Flow 2",
				status: FlowStatus.FINISHED,
				model: null,
				modelProvider: null,
				containerId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		];

		const paginationOutput = {
			docs: flows,
			total: 2,
			page: 1,
			limit: 10,
			totalPages: 1,
		};

		repository.paginate = mockResolvedValue(paginationOutput);

		const result = await usecase.execute({
			page: 1,
			limit: 10,
			search: {},
			sort: {},
		} as FlowListInput);

		expect(result.docs).toHaveLength(2);
		expect(result.total).toBe(2);
		expect(result.page).toBe(1);
	});

	test("should handle empty results", async () => {
		const paginationOutput = {
			docs: [],
			total: 0,
			page: 1,
			limit: 10,
			totalPages: 0,
		};

		repository.paginate = mockResolvedValue(paginationOutput);

		const result = await usecase.execute({
			page: 1,
			limit: 10,
			search: {},
			sort: {},
		} as FlowListInput);

		expect(result.docs).toHaveLength(0);
		expect(result.total).toBe(0);
	});
});
