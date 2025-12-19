import { IContainerGetByIdAdapter } from "@/modules/container/adapter";
import {
	expectZodError,
	getUUID,
	mockRejectedValue,
	mockResolvedValue,
	nameOf,
} from "@/test/mock";
import {
	ApiInternalServerException,
	ApiNotFoundException,
} from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ContainerEntity, ContainerStatus } from "../../entity/container";
import { IContainerRepository } from "../../repository/container";
import {
	type ContainerGetByIdInput,
	ContainerGetByIdUsecase,
} from "../container-get-by-id";

describe(ContainerGetByIdUsecase.name, () => {
	let usecase: IContainerGetByIdAdapter;
	let repository: IContainerRepository;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			imports: [],
			providers: [
				{
					provide: IContainerRepository,
					useValue: {},
				},
				{
					provide: IContainerGetByIdAdapter,
					useFactory: (containerRepository: IContainerRepository) => {
						return new ContainerGetByIdUsecase(containerRepository);
					},
					inject: [IContainerRepository],
				},
			],
		}).compile();

		usecase = app.get(IContainerGetByIdAdapter);
		repository = app.get(IContainerRepository);
	});

	const input: ContainerGetByIdInput = {
		id: "9269248e-54cc-46f9-80c0-7029c989c0e3",
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

	test("when no input is specified, should expect an error", async () => {
		await expectZodError(
			() => usecase.execute({} as ContainerGetByIdInput),
			(issues: ZodExceptionIssue[]) => {
				expect(issues).toEqual([
					{
						message: "Required",
						path: nameOf<ContainerGetByIdInput>("id"),
					},
				]);
			},
		);
	});

	test("when container exists, should return the container", async () => {
		repository.findOne = mockResolvedValue(existingContainer);

		await expect(usecase.execute(input)).resolves.toEqual(existingContainer);
	});

	test("when container not found, should throw NotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
	});

	test("when transaction throw an error, should expect an error", async () => {
		repository.findOne = mockRejectedValue(new ApiInternalServerException());

		await expect(usecase.execute(input)).rejects.toThrow(
			ApiInternalServerException,
		);
	});
});
