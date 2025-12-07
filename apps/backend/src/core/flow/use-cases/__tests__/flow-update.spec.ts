import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import {
	expectZodError,
	getUUID,
	mockFn,
	mockResolvedValue,
	mockTracing,
	nameOf,
} from "@/test/mock";
import { ApiNotFoundException } from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";
import { FlowEntity, FlowStatus } from "../../entity/flow";
import { IFlowRepository } from "../../repository/flow";
import { type FlowUpdateInput, FlowUpdateUsecase } from "../flow-update";

describe(FlowUpdateUsecase.name, () => {
	let usecase: FlowUpdateUsecase;
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
					provide: FlowUpdateUsecase,
					useFactory: (
						flowRepository: IFlowRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new FlowUpdateUsecase(flowRepository, loggerService);
					},
					inject: [IFlowRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(FlowUpdateUsecase);
		repository = app.get(IFlowRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when no id is specified, should expect an error", async () => {
		await expectZodError(
			() => usecase.execute({} as FlowUpdateInput, mockTracing()),
			(issues: ZodExceptionIssue[]) => {
				expect(issues).toEqual([
					{
						message: "Required",
						path: nameOf<FlowUpdateInput>("id"),
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

	test("when flow updated successfully, should return updated flow", async () => {
		const existingFlow = new FlowEntity({
			id: getUUID(),
			name: "Old Name",
			status: FlowStatus.IN_PROGRESS,
			model: "gpt-3.5",
			modelProvider: "openai",
			containerId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const updatedFlow = new FlowEntity({
			...existingFlow,
			name: "New Name",
			model: "gpt-4",
		});

		repository.findOne = mockResolvedValue(existingFlow);
		repository.updateOne = mockResolvedValue(updatedFlow);
		repository.findById = mockResolvedValue(updatedFlow);

		const result = await usecase.execute(
			{ id: getUUID(), name: "New Name", model: "gpt-4" },
			mockTracing(),
		);

		expect(logger.info).toHaveBeenCalledWith({
			message: "flow found",
			obj: { flow: existingFlow },
		});

		expect(result.name).toBe("New Name");
		expect(result.model).toBe("gpt-4");

		expect(logger.info).toHaveBeenCalledWith({
			message: "flow updated successfully",
			obj: {
				flow: expect.objectContaining({
					id: existingFlow.id,
					name: "New Name",
					model: "gpt-4",
				}),
			},
		});
	});

	test("when partial update, should preserve other fields", async () => {
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

		const updatedFlow = new FlowEntity({
			...existingFlow,
			status: FlowStatus.FINISHED,
		});

		repository.findOne = mockResolvedValue(existingFlow);
		repository.updateOne = mockResolvedValue(updatedFlow);
		repository.findById = mockResolvedValue(updatedFlow);

		await usecase.execute(
			{ id: getUUID(), status: FlowStatus.FINISHED },
			mockTracing(),
		);

		expect(repository.updateOne).toHaveBeenCalled();
	});
});
