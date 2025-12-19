import { ILoggerAdapter } from "@/infra/logger";
import type { CreatedModel } from "@/infra/repository";

import { ApiInternalServerException } from "@/utils/exception";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { getUUID, mockFn, mockRejectedValue, mockResolvedValue, mockTracing } from "test/mock";
import { TaskEntity, TaskStatus, TaskType } from "../../entity/task";
import { ITaskRepository } from "../../repository/task";
import { type TaskCreateInput, TaskCreateUsecase } from "../task-create";

describe(TaskCreateUsecase.name, () => {
	let usecase: TaskCreateUsecase;
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
					provide: TaskCreateUsecase,
					useFactory: (
						taskRepository: ITaskRepository,
						loggerService: ILoggerAdapter,
					) => {
						return new TaskCreateUsecase(taskRepository, loggerService);
					},
					inject: [ITaskRepository, ILoggerAdapter],
				},
			],
		}).compile();

		usecase = app.get(TaskCreateUsecase);
		repository = app.get(ITaskRepository);
		logger = app.get(ILoggerAdapter);
	});

	test("when no input is specified, should create task with defaults", async () => {
		const _input = {};
		const expectedTask = new TaskEntity({
			id: getUUID(),
			type: null,
			status: TaskStatus.IN_PROGRESS,
			args: {},
			results: "{}",
			message: null,
			toolCallId: null,
			flowId: null,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repository.create = mockResolvedValue<CreatedModel>(expectedTask);

		const { id, status, results, createdAt, updatedAt, ...createInput } =
			expectedTask;

		const result = await usecase.execute(
			createInput as TaskCreateInput,
			mockTracing(),
		);

		expect(result.id).toEqual(expectedTask.id);
		expect(logger.info).toHaveBeenCalledWith({
			message: "task created successfully",
			obj: { task: expectedTask },
		});
	});

	const input = new TaskEntity({
		id: getUUID(),
		type: TaskType.TERMINAL,
		status: TaskStatus.IN_PROGRESS,
		args: { command: "ls -la" },
		results: "{}",
		message: "Listing files",
		toolCallId: "tool-123",
		flowId: "9269248e-54cc-46f9-80c0-7029c989c0e3",
		createdAt: new Date(),
		updatedAt: new Date(),
	});

	test("when task created successfully, should expect a task created", async () => {
		repository.create = mockResolvedValue<CreatedModel>(input);

		const { id, status, results, createdAt, updatedAt, ...createInput } = input;

		await expect(
			usecase.execute(createInput as TaskCreateInput, mockTracing()),
		).resolves.toEqual(input);

		expect(logger.info).toHaveBeenCalled();
	});

	test("when transaction throw an error, should expect an error", async () => {
		repository.create = mockRejectedValue(new ApiInternalServerException());

		const { id, status, results, createdAt, updatedAt, ...createInput } = input;

		await expect(
			usecase.execute(createInput as TaskCreateInput, mockTracing()),
		).rejects.toThrow(ApiInternalServerException);
	});
});
