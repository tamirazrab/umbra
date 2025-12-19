import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import { IContainerUpdateStatusAdapter } from "@/modules/container/adapter";
import {
	ApiInternalServerException,
	ApiNotFoundException,
} from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";

import { expectZodError, getUUID, mockRejectedValue, mockResolvedValue, mockTracing, nameOf } from "@/test/mock";
import { ContainerEntity, ContainerStatus } from "../../entity/container";
import { IContainerRepository } from "../../repository/container";
import {
	type ContainerUpdateStatusInput,
	ContainerUpdateStatusUsecase,
} from "../container-update-status";

describe(ContainerUpdateStatusUsecase.name, () => {
	let usecase: IContainerUpdateStatusAdapter;
	let repository: IContainerRepository;
	let logger: ILoggerAdapter;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			imports: [],
			providers: [
				{
					provide: IContainerRepository,
					useValue: {},
				},
				{
					provide: ILoggerAdapter,
					useValue: {
						info: vi.fn(),
					},
				},
				{
					provide: IContainerUpdateStatusAdapter,
					useFactory: (
						containerRepository: IContainerRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new ContainerUpdateStatusUsecase(
							containerRepository,
							loggerService,
						);
					},
					inject: [IContainerRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(IContainerUpdateStatusAdapter);
		repository = app.get(IContainerRepository);
		logger = app.get(ILoggerAdapter);
	});

	const existingContainer = new ContainerEntity({
		id: getUUID(),
		name: "test-container",
		localId: "docker-123",
		image: "ubuntu:latest",
		status: ContainerStatus.STARTING,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	const input: ContainerUpdateStatusInput = {
		id: getUUID(),
		status: "running",
	};

	const updatedContainer = new ContainerEntity({
		...existingContainer,
		status: ContainerStatus.RUNNING,
		updatedAt: new Date(),
	});

	test("when no input is specified, should expect an error", async () => {
		await expectZodError(
			() =>
				usecase.execute(
					{} as ContainerUpdateStatusInput,
					mockTracing(),
				),
			(issues: ZodExceptionIssue[]) => {
				expect(issues).toEqual([
					{
						message: "Required",
						path: nameOf<ContainerUpdateStatusInput>("id"),
					},
					{
						message: "Required",
						path: nameOf<ContainerUpdateStatusInput>("status"),
					},
				]);
			},
		);
	});

	test("when status updated successfully, should return updated container", async () => {
		repository.findOne = mockResolvedValue(existingContainer);
		repository.updateOne = mockResolvedValue(updatedContainer);

		const result = await usecase.execute(input, mockTracing());

		expect(result).toEqual(updatedContainer);
		expect(logger.info).toHaveBeenCalledWith({
			message: "container status updated successfully",
			obj: { id: input.id, status: input.status },
		});
	});

	test("when container not found, should throw NotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(
			usecase.execute(input, mockTracing()),
		).rejects.toThrow(ApiNotFoundException);
	});

	test("when invalid status provided, should expect validation error", async () => {
		const invalidInput = {
			id: 1,
			status: "invalid-status",
		};

		await expectZodError(
			() =>
				usecase.execute(
					invalidInput as unknown as ContainerUpdateStatusInput,
					mockTracing(),
				),
			(issues: ZodExceptionIssue[]) => {
				expect(issues[0]?.path).toBe("status");
			},
		);
	});

	test("when transaction throw an error, should expect an error", async () => {
		repository.findOne = mockResolvedValue(existingContainer);
		repository.updateOne = mockRejectedValue(
			new ApiInternalServerException(),
		);

		await expect(
			usecase.execute(input, mockTracing()),
		).rejects.toThrow(ApiInternalServerException);
	});
});
