import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { TaskEntity, TaskStatus, TaskType } from "../../entity/task";
import { ITaskRepository } from "../../repository/task";
import { type TaskListInput, TaskListUsecase } from "../task-list";
import { getUUID, mockResolvedValue } from "test/mock";

describe(TaskListUsecase.name, () => {
	let usecase: TaskListUsecase;
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
					provide: TaskListUsecase,
					useFactory: (taskRepository: ITaskRepository) => {
						return new TaskListUsecase(taskRepository);
					},
					inject: [ITaskRepository],
				},
			],
		}).compile();

		usecase = app.get(TaskListUsecase);
		repository = app.get(ITaskRepository);
	});

	test("should return paginated tasks", async () => {
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
		];

		const paginationOutput = {
			docs: tasks,
			total: 1,
			page: 1,
			limit: 10,
			totalPages: 1,
		};

		repository.paginate = mockResolvedValue(paginationOutput);

		const result = await usecase.execute({
			page: 1,
			limit: 10,
			search: {},
			sort: {},
		} as TaskListInput);

		expect(result.docs).toHaveLength(1);
		expect(result.total).toBe(1);
	});
});
