import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import { ApiNotFoundException } from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";

import { FlowEntity, FlowStatus } from "../../entity/flow";
import { IFlowRepository } from "../../repository/flow";
import {
	type FlowUpdateStatusInput,
	FlowUpdateStatusUsecase,
} from "../flow-update-status";
import { mockFn, expectZodError, mockTracing, nameOf, mockResolvedValue, getUUID } from "@/test/mock";

describe(FlowUpdateStatusUsecase.name, () => {
	let usecase: FlowUpdateStatusUsecase;
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
					provide: FlowUpdateStatusUsecase,
					useFactory: (
						flowRepository: IFlowRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new FlowUpdateStatusUsecase(flowRepository, loggerService);
					},
					inject: [IFlowRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(FlowUpdateStatusUsecase);
		repository = app.get(IFlowRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when no id is specified, should expect an error", async () => {
		await expectZodError(
			() =>
				usecase.execute(
					{ status: FlowStatus.FINISHED } as FlowUpdateStatusInput,
					mockTracing(),
				),
			(issues: ZodExceptionIssue[]) => {
				expect(issues).toEqual([
					{
						message: "Required",
						path: nameOf<FlowUpdateStatusInput>("id"),
					},
				]);
			},
		);
	});

	test("when flow not found, should throw ApiNotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(
			usecase.execute(
				{ id: getUUID(), status: FlowStatus.FINISHED },
				mockTracing(),
			),
		).rejects.toThrow(ApiNotFoundException);
	});

	test("when status updated successfully, should return updated flow", async () => {
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

		const result = await usecase.execute(
			{ id: getUUID(), status: FlowStatus.FINISHED },
			mockTracing(),
		);

		expect(result.status).toBe(FlowStatus.FINISHED);
		expect(logger.info).toHaveBeenCalledWith({
			message: "flow status updated successfully",
			obj: { id: getUUID(), status: FlowStatus.FINISHED },
		});
	});
});
