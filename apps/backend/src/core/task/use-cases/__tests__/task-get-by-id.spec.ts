import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ApiNotFoundException } from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";

import { TaskEntity, TaskStatus, TaskType } from "../../entity/task";
import { ITaskRepository } from "../../repository/task";
import { type TaskGetByIdInput, TaskGetByIdUsecase } from "../task-get-by-id";
import { expectZodError, nameOf, mockResolvedValue, getUUID } from "test/mock";

describe(TaskGetByIdUsecase.name, () => {
	let usecase: TaskGetByIdUsecase;
	let repository: ITaskRepository;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			imports: [],
			providers: [
				{
					provide: ITaskRepository,
					useValue: {},
				},
				{
					provide: TaskGetByIdUsecase,
					useFactory: (taskRepository: ITaskRepository) => {
						return new TaskGetByIdUsecase(taskRepository);
					},
					inject: [ITaskRepository],
				},
			],
		}).compile();

		usecase = app.get(TaskGetByIdUsecase);
		repository = app.get(ITaskRepository);
	});

	test("when no id is specified, should expect an error", async () => {
		await expectZodError(
			() => usecase.execute({} as TaskGetByIdInput),
			(issues: ZodExceptionIssue[]) => {
				expect(issues).toEqual([
					{
						message: "Required",
						path: nameOf<TaskGetByIdInput>("id"),
					},
				]);
			},
		);
	});

	test("when task not found, should throw ApiNotFoundException", async () => {
		repository.findOne = mockResolvedValue(null);

			await expect(usecase.execute({ id: getUUID() })).rejects.toThrow(
			ApiNotFoundException,
		);
	});

	test("when task found, should return task", async () => {
		const task = new TaskEntity({
			id: getUUID(),
			type: TaskType.TERMINAL,
			status: TaskStatus.FINISHED,
			args: { command: "pwd" },
			results: "/home/user",
			message: "Get working directory",
			toolCallId: "tool-456",
			flowId: "1",
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repository.findOne = mockResolvedValue(task);

		await expect(usecase.execute({ id: getUUID() })).resolves.toEqual(task);
	});
});
