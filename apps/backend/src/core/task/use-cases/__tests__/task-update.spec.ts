import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import { getUUID, mockFn, mockResolvedValue, mockTracing } from "@/test/mock";
import { ApiNotFoundException } from "@/utils/exception";
import { TaskEntity, TaskStatus, TaskType } from "../../entity/task";
import { ITaskRepository } from "../../repository/task";
import { TaskUpdateUsecase } from "../task-update";

describe(TaskUpdateUsecase.name, () => {
	let usecase: TaskUpdateUsecase;
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
					provide: TaskUpdateUsecase,
					useFactory: (
						taskRepository: ITaskRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new TaskUpdateUsecase(taskRepository, loggerService);
					},
					inject: [ITaskRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(TaskUpdateUsecase);
		repository = app.get(ITaskRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when task not found, should throw ApiNotFoundException", async () => {
		repository.findById = mockResolvedValue(null);

		await expect(
			usecase.execute({ id: getUUID() }, mockTracing()),
		).rejects.toThrow(ApiNotFoundException);
	});

	test("when task updated successfully, should return updated task", async () => {
		const existingTask = new TaskEntity({
			id: getUUID(),
			type: TaskType.TERMINAL,
			status: TaskStatus.IN_PROGRESS,
			args: { command: "ls" },
			results: "{}",
			message: "Old message",
			toolCallId: null,
			flowId: 1,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const updatedTask = new TaskEntity({
			...existingTask,
			message: "New message",
		});

		repository.findById = vi
			.fn()
			.mockResolvedValueOnce(existingTask)
			.mockResolvedValueOnce(updatedTask);
		repository.updateOne = mockResolvedValue(updatedTask);

		const result = await usecase.execute(
			{ id: getUUID(), message: "New message" },
			mockTracing(),
		);

		expect(result.message).toBe("New message");
		expect(logger.info).toHaveBeenCalled();
	});
});
