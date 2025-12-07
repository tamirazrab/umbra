import { IContainerListAdapter } from "@/modules/container/adapter";
import { getUUID, mockRejectedValue, mockResolvedValue } from "@/test/mock";
import { ApiInternalServerException } from "@/utils/exception";
import type { PaginationOutput } from "@/utils/pagination";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ContainerEntity, ContainerStatus } from "../../entity/container";
import { IContainerRepository } from "../../repository/container";
import {
	type ContainerListInput,
	ContainerListUsecase,
} from "../container-list";

describe(ContainerListUsecase.name, () => {
	let usecase: IContainerListAdapter;
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
					provide: IContainerListAdapter,
					useFactory: (containerRepository: IContainerRepository) => {
						return new ContainerListUsecase(containerRepository);
					},
					inject: [IContainerRepository],
				},
			],
		}).compile();

		usecase = app.get(IContainerListAdapter);
		repository = app.get(IContainerRepository);
	});

	const input: ContainerListInput = {
		limit: 10,
		page: 1,
		search: {},
		sort: { createdAt: 1 },
	};

	const containers = [
		new ContainerEntity({
			id: getUUID(),
			name: "container-1",
			localId: "docker-1",
			image: "ubuntu:latest",
			status: ContainerStatus.RUNNING,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
		new ContainerEntity({
			id: getUUID(),
			name: "container-2",
			localId: "docker-2",
			image: "node:18",
			status: ContainerStatus.STARTING,
			createdAt: new Date(),
			updatedAt: new Date(),
		}),
	];

	const paginatedResult: PaginationOutput<ContainerEntity> = {
		docs: containers,
		total: 2,
		page: 1,
		limit: 10,
	};

	test("when containers exist, should return paginated list", async () => {
		repository.paginate = mockResolvedValue(paginatedResult);

		await expect(usecase.execute(input)).resolves.toEqual(paginatedResult);
	});

	test("when no containers exist, should return empty list", async () => {
		const emptyResult: PaginationOutput<ContainerEntity> = {
			docs: [],
			total: 0,
			page: 1,
			limit: 10,
		};

		repository.paginate = mockResolvedValue(emptyResult);

		await expect(usecase.execute(input)).resolves.toEqual(emptyResult);
	});

	test("when transaction throw an error, should expect an error", async () => {
		repository.paginate = mockRejectedValue(new ApiInternalServerException());

		await expect(usecase.execute(input)).rejects.toThrow(
			ApiInternalServerException,
		);
	});
});
