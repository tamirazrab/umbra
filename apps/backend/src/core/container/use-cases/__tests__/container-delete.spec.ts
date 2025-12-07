import { Test } from "@nestjs/testing";

import { ILoggerAdapter } from "@/infra/logger";
import { IContainerDeleteAdapter } from "@/modules/container/adapter";
import {
	ApiInternalServerException,
	ApiNotFoundException,
} from "@/utils/exception";

import { ContainerEntity, ContainerStatus } from "../../entity/container";
import { IContainerRepository } from "../../repository/container";
import {
	type ContainerDeleteInput,
	ContainerDeleteUsecase,
} from "../container-delete";
import { mockResolvedValue, mockTracing, mockRejectedValue, getUUID } from "@/test/mock";
import { describe, beforeEach, vi, test, expect } from "vitest";

describe(ContainerDeleteUsecase.name, () => {
	let usecase: IContainerDeleteAdapter;
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
					provide: IContainerDeleteAdapter,
					useFactory: (
						containerRepository: IContainerRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new ContainerDeleteUsecase(
							containerRepository,
							loggerService,
						);
					},
					inject: [IContainerRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(IContainerDeleteAdapter);
		repository = app.get(IContainerRepository);
		logger = app.get(ILoggerAdapter);
	});

	const input: ContainerDeleteInput = {
		id: getUUID(),
	};

	const existingContainer = new ContainerEntity({
		id: getUUID(),
		name: "test-container",
		localId: "docker-123",
		image: "ubuntu:latest",
		status: ContainerStatus.RUNNING,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	test("when container exists, should delete successfully", async () => {
		repository.findOne = mockResolvedValue(existingContainer);
		repository.remove = mockResolvedValue(existingContainer);

		await expect(
			usecase.execute(input, mockTracing()),
		).resolves.toBeUndefined();

		expect(logger.info).toHaveBeenCalledWith({
			message: "container deleted successfully",
			obj: { id: input.id },
		});
	});

	test("when container not found, should throw NotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(
			usecase.execute(input, mockTracing()),
		).rejects.toThrow(ApiNotFoundException);
	});

	test("when transaction throw an error, should expect an error", async () => {
		repository.findOne = mockResolvedValue(existingContainer);
		repository.remove = mockRejectedValue(
			new ApiInternalServerException(),
		);

		await expect(
			usecase.execute(input, mockTracing()),
		).rejects.toThrow(ApiInternalServerException);
	});
});
