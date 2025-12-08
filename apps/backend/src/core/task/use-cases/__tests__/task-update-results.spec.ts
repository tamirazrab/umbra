import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import { getUUID, mockFn, mockResolvedValue, mockTracing } from "@/test/mock";
import { ApiNotFoundException } from "@/utils/exception";
import { TaskEntity, TaskStatus, TaskType } from "../../entity/task";
import { ITaskRepository } from "../../repository/task";
import { TaskUpdateResultsUsecase } from "../task-update-results";

describe(TaskUpdateResultsUsecase.name, () => {
	let usecase: TaskUpdateResultsUsecase;
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
					provide: TaskUpdateResultsUsecase,
					useFactory: (
						taskRepository: ITaskRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new TaskUpdateResultsUsecase(taskRepository, loggerService);
					},
					inject: [ITaskRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(TaskUpdateResultsUsecase);
		repository = app.get(ITaskRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when task not found, should throw ApiNotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(
			usecase.execute({ id: getUUID(), results: "new results" }, mockTracing()),
		).rejects.toThrow(ApiNotFoundException);
	});

	test("when results updated successfully, should return updated task", async () => {
		const existingTask = new TaskEntity({
			id: getUUID(),
			type: TaskType.TERMINAL,
			status: TaskStatus.IN_PROGRESS,
			args: {},
			results: "{}",
			message: null,
			toolCallId: null,
			flowId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const updatedTask = new TaskEntity({
			...existingTask,
			results: "command output here",
		});

		repository.findOne = mockResolvedValue(existingTask);
		repository.updateOne = mockResolvedValue(updatedTask);
		repository.findById = vi.fn().mockResolvedValueOnce(updatedTask);

		const result = await usecase.execute(
			{ id: getUUID(), results: "command output here" },
			mockTracing(),
		);

		expect(result.results).toBe("command output here");
		expect(logger.info).toHaveBeenCalled();
	});
});
