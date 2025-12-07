import { Test } from "@nestjs/testing";
import { getUUID, mockRejectedValue, mockResolvedValue, mockTracing } from "test/mock";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import type { CreatedModel } from "@/infra/repository";
import { IContainerCreateAdapter } from "@/modules/container/adapter";
import { ApiInternalServerException } from "@/utils/exception";

import { ContainerEntity, ContainerStatus } from "../../entity/container";
import { IContainerRepository } from "../../repository/container";
import {
	type ContainerCreateInput,
	ContainerCreateUsecase,
} from "../container-create";

describe(ContainerCreateUsecase.name, () => {
	let usecase: IContainerCreateAdapter;
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
					provide: IContainerCreateAdapter,
					useFactory: (
						containerRepository: IContainerRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new ContainerCreateUsecase(
							containerRepository,
							loggerService,
						);
					},
					inject: [IContainerRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(IContainerCreateAdapter);
		repository = app.get(IContainerRepository);
		logger = app.get(ILoggerAdapter);
	});

	const input: ContainerCreateInput = {
		name: "test-container",
		localId: "docker-123",
		image: "ubuntu:latest",
	};

	const createdContainer = new ContainerEntity({
		id: getUUID(),
		name: "test-container",
		localId: "docker-123",
		image: "ubuntu:latest",
		status: ContainerStatus.STARTING,
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	test("when container created successfully, should expect a container created", async () => {
		repository.create = mockResolvedValue<CreatedModel>(createdContainer);

		const result = await usecase.execute(input, mockTracing());

		expect(result).toEqual(createdContainer);
		expect(logger.info).toHaveBeenCalledWith({
			message: "container created successfully",
			obj: { container: createdContainer },
		});
	});

	test("when container created with partial data, should expect a container created", async () => {
		const partialInput: ContainerCreateInput = {
			name: "test-container",
		};

		const partialContainer = new ContainerEntity({
			id: getUUID(),
			name: "test-container",
			localId: null,
			image: null,
			status: ContainerStatus.STARTING,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repository.create = mockResolvedValue<CreatedModel>(partialContainer);

		await expect(usecase.execute(partialInput, mockTracing())).resolves.toEqual(
			partialContainer,
		);
	});

	test("when transaction throw an error, should expect an error", async () => {
		repository.create = mockRejectedValue(new ApiInternalServerException());

		await expect(usecase.execute(input, mockTracing())).rejects.toThrow(
			ApiInternalServerException,
		);
	});
});
