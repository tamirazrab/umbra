import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import type { CreatedModel } from "@/infra/repository";
import { ApiInternalServerException } from "@/utils/exception";

import { FlowEntity, FlowStatus } from "../../entity/flow";
import { IFlowRepository } from "../../repository/flow";
import { type FlowCreateInput, FlowCreateUsecase } from "../flow-create";
import { mockFn, mockResolvedValue, mockRejectedValue, mockTracing, getUUID } from "@/test/mock";
import { IFlowCreateAdapter } from "@/modules/flow/adapter";

describe(FlowCreateUsecase.name, () => {
	let usecase: IFlowCreateAdapter;
	let repository: IFlowRepository;
	let logger: ILoggerAdapter;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			imports: [],
			providers: [
				{
					provide: IFlowRepository,
					useValue: {},
				},
				{
					provide: ILoggerAdapter,
					useValue: {
						info: mockFn(),
					},
				},
				{
					provide: FlowCreateUsecase,
					useFactory: (
						flowRepository: IFlowRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new FlowCreateUsecase(flowRepository, loggerService);
					},
					inject: [IFlowRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(FlowCreateUsecase);
		repository = app.get(IFlowRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when no input is specified, should create flow with defaults", async () => {
		const input = {};
		const expectedFlow = new FlowEntity({
			id: getUUID(),
			name: null,
			status: FlowStatus.IN_PROGRESS,
			model: null,
			modelProvider: null,
			containerId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repository.create = mockResolvedValue<CreatedModel>(expectedFlow);

		const result = await usecase.execute(
			input as FlowCreateInput,
			mockTracing(),
		);

		expect(result.id).toBeDefined();
		expect(result.id).toEqual(expectedFlow.id);

		expect(logger.info).toHaveBeenCalledWith({
			message: "flow created successfully",
			obj: { flow: expectedFlow },
		});
	});

	const input = new FlowEntity({
		id: getUUID(),
		name: "Test Flow",
		status: FlowStatus.IN_PROGRESS,
		model: "gpt-4",
		modelProvider: "openai",
		containerId: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	test("when flow created successfully, should expect a flow created", async () => {
		repository.findOne = mockResolvedValue<FlowEntity>(null);
		const createOutput = { created: true, id: getUUID() };
		repository.create = mockResolvedValue<CreatedModel>(createOutput);

		await expect(
			usecase.execute(input as FlowCreateInput, mockTracing()),
		).resolves.toEqual(createOutput);

		expect(logger.info).toHaveBeenCalled();
	});

	test("when transaction throw an error, should expect an error", async () => {
		repository.create = mockRejectedValue(
			new ApiInternalServerException(),
		);

		await expect(usecase.execute(input, mockTracing())).rejects.toThrow(
			ApiInternalServerException,
		);
	});
});
