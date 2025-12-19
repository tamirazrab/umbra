import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import { ApiNotFoundException } from "@/utils/exception";

import { TaskEntity, TaskStatus, TaskType } from "../../entity/task";
import { ITaskRepository } from "../../repository/task";
import { TaskDeleteUsecase } from "../task-delete";
import { getUUID, mockFn, mockResolvedValue, mockTracing } from "test/mock";

describe(TaskDeleteUsecase.name, () => {
	let usecase: TaskDeleteUsecase;
	let repository: ITaskRepository;
	let logger: ILoggerAdapter;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			imports: [],
			providers: [
				{
					provide: ITaskRepository,
					useValue: {},
				},
				{
					provide: ILoggerAdapter,
					useValue: {
						info: mockFn(),
					},
				},
				{
					provide: TaskDeleteUsecase,
					useFactory: (
						taskRepository: ITaskRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new TaskDeleteUsecase(taskRepository, loggerService);
					},
					inject: [ITaskRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(TaskDeleteUsecase);
		repository = app.get(ITaskRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when task not found, should throw ApiNotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(
			usecase.execute({ id: getUUID() }, mockTracing()),
		).rejects.toThrow(ApiNotFoundException);
	});

	test("when task deleted successfully, should log and remove", async () => {
		const task = new TaskEntity({
			id: getUUID(),
			type: TaskType.TERMINAL,
			status: TaskStatus.FINISHED,
			args: {},
			results: "{}",
			message: null,
			toolCallId: null,
			flowId: "1",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repository.findOne = mockResolvedValue(task);
		repository.remove = mockResolvedValue(undefined);

		await usecase.execute({ id: getUUID() }, mockTracing());

		expect(repository.remove).toHaveBeenCalledWith({ id: getUUID() });
		expect(logger.info).toHaveBeenCalled();
	});
});
