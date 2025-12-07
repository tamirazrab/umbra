import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ApiNotFoundException } from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";

import { FlowEntity, FlowStatus } from "../../entity/flow";
import { IFlowRepository } from "../../repository/flow";
import { type FlowGetByIdInput, FlowGetByIdUsecase } from "../flow-get-by-id";
import { expectZodError, nameOf, mockResolvedValue, getUUID } from "@/test/mock";

describe(FlowGetByIdUsecase.name, () => {
	let usecase: FlowGetByIdUsecase;
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
					provide: FlowGetByIdUsecase,
					useFactory: (flowRepository: IFlowRepository) => {
						return new FlowGetByIdUsecase(flowRepository);
					},
					inject: [IFlowRepository],
				},
			],
		}).compile();

		usecase = app.get(FlowGetByIdUsecase);
		repository = app.get(IFlowRepository);
	});

	test("when no id is specified, should expect an error", async () => {
		await expectZodError(
			() => usecase.execute({} as FlowGetByIdInput),
			(issues: ZodExceptionIssue[]) => {
				expect(issues).toEqual([
					{
						message: "Required",
						path: nameOf<FlowGetByIdInput>("id"),
					},
				]);
			},
		);
	});

	test("when flow not found, should throw ApiNotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(usecase.execute({ id: getUUID()})).rejects.toThrow(
			ApiNotFoundException,
		);
	});

	test("when flow found, should return flow", async () => {
		const flow = new FlowEntity({
			id: getUUID(),
			name: "Test Flow",
			status: FlowStatus.IN_PROGRESS,
			model: "gpt-4",
			modelProvider: "openai",
			containerId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repository.findOne = mockResolvedValue(flow);

		await expect(usecase.execute({ id: getUUID() })).resolves.toEqual(flow);
	});
});
