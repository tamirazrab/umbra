import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { TaskEntity, TaskStatus, TaskType } from "../../entity/task";
import { ITaskRepository } from "../../repository/task";
import { TaskFindByFlowUsecase } from "../task-find-by-flow";
import { getUUID, mockResolvedValue } from "test/mock";

describe(TaskFindByFlowUsecase.name, () => {
	let usecase: TaskFindByFlowUsecase;
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
					provide: TaskFindByFlowUsecase,
					useFactory: (taskRepository: ITaskRepository) => {
						return new TaskFindByFlowUsecase(taskRepository);
					},
					inject: [ITaskRepository],
				},
			],
		}).compile();

		usecase = app.get(TaskFindByFlowUsecase);
		repository = app.get(ITaskRepository);
	});

	test("should return tasks for specific flow", async () => {
		const tasks = [
			new TaskEntity({
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
			}),
			new TaskEntity({
				id: getUUID(),
				type: TaskType.BROWSER,
				status: TaskStatus.IN_PROGRESS,
				args: {},
				results: "{}",
				message: null,
				toolCallId: null,
				flowId: "2",
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		];

		repository.find = mockResolvedValue(tasks);

		const result = await usecase.execute({ flowId: "1" });

		expect(result).toHaveLength(2);
		expect(result[0]?.flowId).toBe("1");
		expect(result[1]?.flowId).toBe("2");
	});
});
