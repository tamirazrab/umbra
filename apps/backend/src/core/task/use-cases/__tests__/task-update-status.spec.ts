import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ILoggerAdapter } from "@/infra/logger";
import { ApiNotFoundException } from "@/utils/exception";
import { TaskEntity, TaskStatus, TaskType } from "../../entity/task";
import { ITaskRepository } from "../../repository/task";
import { TaskUpdateStatusUsecase } from "../task-update-status";
import { mockFn, mockResolvedValue, mockTracing, getUUID } from "test/mock";

describe(TaskUpdateStatusUsecase.name, () => {
	let usecase: TaskUpdateStatusUsecase;
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
					provide: TaskUpdateStatusUsecase,
					useFactory: (
						taskRepository: ITaskRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new TaskUpdateStatusUsecase(taskRepository, loggerService);
					},
					inject: [ITaskRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(TaskUpdateStatusUsecase);
		repository = app.get(ITaskRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when task not found, should throw ApiNotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

		await expect(
			usecase.execute({ id: 999, status: TaskStatus.FINISHED }, mockTracing()),
		).rejects.toThrow(ApiNotFoundException);
	});

	test("when status updated successfully, should return updated task", async () => {
		const existingTask = new TaskEntity({
			id: getUUID(),
			type: TaskType.TERMINAL,
			status: TaskStatus.IN_PROGRESS,
			args: {},
			results: "{}",
			message: null,
			toolCallId: null,
			flowId: "1",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const updatedTask = new TaskEntity({
			...existingTask,
			status: TaskStatus.FINISHED,
		});

		repository.findOne = mockResolvedValue(existingTask);
		repository.updateOne = mockResolvedValue(updatedTask);
		repository.findById = vi.fn().mockResolvedValueOnce(updatedTask);

		const result = await usecase.execute(
			{ id: 1, status: TaskStatus.FINISHED },
			mockTracing(),
		);

		expect(result.status).toBe(TaskStatus.FINISHED);
		expect(logger.info).toHaveBeenCalled();
	});
});
