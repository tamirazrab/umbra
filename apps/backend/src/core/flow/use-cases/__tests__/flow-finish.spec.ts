import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import { ApiNotFoundException } from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";

import { FlowEntity, FlowStatus } from "../../entity/flow";
import { IFlowRepository } from "../../repository/flow";
import { type FlowFinishInput, FlowFinishUsecase } from "../flow-finish";
import { mockFn, expectZodError, mockTracing, nameOf, mockResolvedValue, getUUID } from "@/test/mock";

describe(FlowFinishUsecase.name, () => {
	let usecase: FlowFinishUsecase;
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
					provide: FlowFinishUsecase,
					useFactory: (
						flowRepository: IFlowRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new FlowFinishUsecase(flowRepository, loggerService);
					},
					inject: [IFlowRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(FlowFinishUsecase);
		repository = app.get(IFlowRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when no id is specified, should expect an error", async () => {
		await expectZodError(
			() => usecase.execute({} as FlowFinishInput, mockTracing()),
			(issues: ZodExceptionIssue[]) => {
				expect(issues).toEqual([
					{
						message: "Required",
						path: nameOf<FlowFinishInput>("id"),
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

	test("when flow finished successfully, should set status to FINISHED", async () => {
		const existingFlow = new FlowEntity({
			id: getUUID(),
			name: "Test Flow",
			status: FlowStatus.IN_PROGRESS,
			model: "gpt-4",
			modelProvider: "openai",
			containerId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const finishedFlow = new FlowEntity({
			...existingFlow,
			status: FlowStatus.FINISHED,
		});

		repository.findOne = mockResolvedValue(existingFlow);
		repository.updateOne = mockResolvedValue(finishedFlow);

		const result = await usecase.execute({ id: getUUID() }, mockTracing());

		expect(result.status).toBe(FlowStatus.FINISHED);
		expect(logger.info).toHaveBeenCalledWith({
			message: "flow finished successfully",
			obj: { id: getUUID() },
		});
	});
});
