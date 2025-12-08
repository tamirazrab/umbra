import { TaskEntity, TaskStatus, TaskType } from "@/core/task/entity/task";
import {
	getUUID,
	mockFn,
	mockResolvedValue,
	mockTracing,
	mockUser,
} from "@/test/mock";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";
import {
	ITaskCreateAdapter,
	ITaskDeleteAdapter,
	ITaskFindByFlowAdapter,
	ITaskGetByIdAdapter,
	ITaskListAdapter,
	ITaskUpdateAdapter,
	ITaskUpdateResultsAdapter,
	ITaskUpdateStatusAdapter,
} from "../adapter";
import { TaskController } from "../controller";

describe(TaskController.name, () => {
	let controller: TaskController;
	let createUsecase: ITaskCreateAdapter;
	let updateUsecase: ITaskUpdateAdapter;
	let deleteUsecase: ITaskDeleteAdapter;
	let listUsecase: ITaskListAdapter;
	let getByIdUsecase: ITaskGetByIdAdapter;
	let updateStatusUsecase: ITaskUpdateStatusAdapter;
	let updateResultsUsecase: ITaskUpdateResultsAdapter;
	let findByFlowUsecase: ITaskFindByFlowAdapter;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			controllers: [TaskController],
			providers: [
				{
					provide: ITaskCreateAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: ITaskUpdateAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: ITaskDeleteAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: ITaskListAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: ITaskGetByIdAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: ITaskUpdateStatusAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: ITaskUpdateResultsAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: ITaskFindByFlowAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
			],
		}).compile();

		controller = app.get<TaskController>(TaskController);
		createUsecase = app.get(ITaskCreateAdapter);
		updateUsecase = app.get(ITaskUpdateAdapter);
		deleteUsecase = app.get(ITaskDeleteAdapter);
		listUsecase = app.get(ITaskListAdapter);
		getByIdUsecase = app.get(ITaskGetByIdAdapter);
		updateStatusUsecase = app.get(ITaskUpdateStatusAdapter);
		updateResultsUsecase = app.get(ITaskUpdateResultsAdapter);
		findByFlowUsecase = app.get(ITaskFindByFlowAdapter);
	});

	test("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("create", () => {
		test("should create a task", async () => {
			const task = new TaskEntity({
				id: getUUID(),
				type: TaskType.TERMINAL,
				status: TaskStatus.IN_PROGRESS,
				args: { command: "ls" },
				results: "{}",
				message: "List files",
				toolCallId: "tool-123",
				flowId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			createUsecase.execute = mockResolvedValue(task);

			const req = {
				body: {
					type: TaskType.TERMINAL,
					args: { command: "ls" },
				},
				user: mockUser(),
				tracing: mockTracing(),
			} as any;

			const result = await controller.create(req);

			expect(result).toEqual(task);
			expect(createUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("update", () => {
		test("should update a task", async () => {
			const task = new TaskEntity({
				id: getUUID(),
				type: TaskType.TERMINAL,
				status: TaskStatus.IN_PROGRESS,
				args: {},
				results: "{}",
				message: "Updated message",
				toolCallId: null,
				flowId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			updateUsecase.execute = mockResolvedValue(task);

			const req = {
				body: {
					message: "Updated message",
				},
				params: {
					id: "1",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			const result = await controller.update(req);

			expect(result).toEqual(task);
			expect(updateUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("list", () => {
		test("should return paginated tasks", async () => {
			const paginationOutput = {
				docs: [],
				total: 0,
				page: 1,
				limit: 10,
			};

			listUsecase.execute = mockResolvedValue(paginationOutput);

			const req = {
				query: {
					page: "1",
					limit: "10",
					sort: undefined,
					search: undefined,
				},
			} as any;

			const result = await controller.list(req);

			expect(result).toEqual(paginationOutput);
			expect(listUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("getById", () => {
		test("should get task by id", async () => {
			const task = new TaskEntity({
				id: getUUID(),
				type: TaskType.TERMINAL,
				status: TaskStatus.FINISHED,
				args: {},
				results: "{}",
				message: null,
				toolCallId: null,
				flowId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			getByIdUsecase.execute = mockResolvedValue(task);

			const req = {
				params: {
					id: "1",
				},
			} as any;

			const result = await controller.getById(req);

			expect(result).toEqual(task);
			expect(getByIdUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("findByFlow", () => {
		test("should get tasks by flow id", async () => {
			const tasks = [
				new TaskEntity({
					id: getUUID(),
					type: TaskType.TERMINAL,
					status: TaskStatus.FINISHED,
					args: {},
					results: "{}",
					message: null,
					toolCallId: null,
					flowId: 1,
					createdAt: new Date(),
					updatedAt: new Date(),
				}),
			];

			findByFlowUsecase.execute = mockResolvedValue(tasks);

			const req = {
				params: {
					flowId: "1",
				},
			} as any;

			const result = await controller.findByFlow(req);

			expect(result).toEqual(tasks);
			expect(findByFlowUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("delete", () => {
		test("should delete a task", async () => {
			deleteUsecase.execute = mockResolvedValue(undefined);

			const req = {
				params: {
					id: "1",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			await controller.delete(req);

			expect(deleteUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("updateStatus", () => {
		test("should update task status", async () => {
			const task = new TaskEntity({
				id: getUUID(),
				type: TaskType.TERMINAL,
				status: TaskStatus.FINISHED,
				args: {},
				results: "{}",
				message: null,
				toolCallId: null,
				flowId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			updateStatusUsecase.execute = mockResolvedValue(task);

			const req = {
				body: {
					status: TaskStatus.FINISHED,
				},
				params: {
					id: "1",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			const result = await controller.updateStatus(req);

			expect(result).toEqual(task);
			expect(updateStatusUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("updateResults", () => {
		test("should update task results", async () => {
			const task = new TaskEntity({
				id: getUUID(),
				type: TaskType.TERMINAL,
				status: TaskStatus.FINISHED,
				args: {},
				results: "output here",
				message: null,
				toolCallId: null,
				flowId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			updateResultsUsecase.execute = mockResolvedValue(task);

			const req = {
				body: {
					results: "output here",
				},
				params: {
					id: "1",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			const result = await controller.updateResults(req);

			expect(result).toEqual(task);
			expect(updateResultsUsecase.execute).toHaveBeenCalled();
		});
	});
});
