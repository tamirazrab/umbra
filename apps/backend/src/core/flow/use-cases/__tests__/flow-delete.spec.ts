import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import { ApiNotFoundException } from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";

import { FlowEntity, FlowStatus } from "../../entity/flow";
import { IFlowRepository } from "../../repository/flow";
import { type FlowDeleteInput, FlowDeleteUsecase } from "../flow-delete";
import { mockFn, expectZodError, mockTracing, nameOf, mockResolvedValue, getUUID } from "@/test/mock";

describe(FlowDeleteUsecase.name, () => {
	let usecase: FlowDeleteUsecase;
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
					provide: FlowDeleteUsecase,
					useFactory: (
						flowRepository: IFlowRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new FlowDeleteUsecase(flowRepository, loggerService);
					},
					inject: [IFlowRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(FlowDeleteUsecase);
		repository = app.get(IFlowRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when no id is specified, should expect an error", async () => {
		await expectZodError(
			() => usecase.execute({} as FlowDeleteInput, mockTracing()),
			(issues: ZodExceptionIssue[]) => {
				expect(issues).toEqual([
					{
						message: "Required",
						path: nameOf<FlowDeleteInput>("id"),
					},
				]);
			},
		);
	});

	test("when flow not found, should throw ApiNotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(
			usecase.execute({ id: getUUID() }, mockTracing()),
		).rejects.toThrow(ApiNotFoundException);
	});

	test("when flow deleted successfully, should log and remove", async () => {
		const flow = new FlowEntity({
			id: getUUID(),
			name: "Test Flow",
			status: FlowStatus.IN_PROGRESS,
			model: null,
			modelProvider: null,
			containerId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repository.findOne = mockResolvedValue(flow);
		repository.remove = mockResolvedValue(undefined);

		await usecase.execute({ id: getUUID() }, mockTracing());

		expect(repository.remove).toHaveBeenCalledWith({ id: getUUID() });
		expect(logger.info).toHaveBeenCalledWith({
			message: "flow deleted successfully",
			obj: { id: getUUID() },
		});
	});
});
