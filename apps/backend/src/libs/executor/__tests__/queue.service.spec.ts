import { getQueueToken } from "@nestjs/bull";
import { Test } from "@nestjs/testing";
import type { Queue } from "bull";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TaskEntity, TaskStatus, TaskType } from "@/core/task/entity/task";
import { getUUID } from "../../../../test/mock";

import { EXECUTOR_QUEUE, QueueService } from "../queue.service";

describe(QueueService.name, () => {
	let service: QueueService;
	let mockQueue: Queue;

	beforeEach(async () => {
		mockQueue = {
			add: vi.fn().mockResolvedValue({}),
			getJobs: vi.fn().mockResolvedValue([]),
		} as unknown as Queue;

		const app = await Test.createTestingModule({
			providers: [
				{
					provide: getQueueToken(EXECUTOR_QUEUE),
					useValue: mockQueue,
				},
				QueueService,
			],
		}).compile();

		service = app.get(QueueService);
	});

	test("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("addQueue", () => {
		test("should add queue successfully", async () => {
			await service.addQueue(123);

			// Queue is created automatically by Bull
			expect(service).toBeDefined();
		});
	});

	describe("addTask", () => {
		test("should add task to queue", async () => {
			const flowId = 123;
			const task = new TaskEntity({
				id: getUUID(),
				type: TaskType.TERMINAL,
				status: TaskStatus.IN_PROGRESS,
				args: { command: "ls -la" },
				results: "{}",
				message: "List files",
				toolCallId: null,
				flowId: String(flowId),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			await service.addTask(flowId, task);

			expect(mockQueue.add).toHaveBeenCalledWith(
				{
					flowId,
					task,
				},
				{
					jobId: `${flowId}-${task.id}`,
					removeOnComplete: true,
					removeOnFail: false,
				},
			);
		});
	});

	describe("getNextTask", () => {
		test("should return next task from queue", async () => {
			const flowId = 123;
			const task = new TaskEntity({
				id: getUUID(),
				type: TaskType.TERMINAL,
				status: TaskStatus.IN_PROGRESS,
				args: {},
				results: "{}",
				message: null,
				toolCallId: null,
				flowId: String(flowId),
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			(mockQueue.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					data: { flowId, task },
				},
			]);

			const result = await service.getNextTask(flowId);

			expect(result).toEqual(task);
		});

		test("should return null if no tasks in queue", async () => {
			(mockQueue.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const result = await service.getNextTask(123);

			expect(result).toBeNull();
		});
	});

	describe("shouldStop", () => {
		test("should return true if no jobs for flow", async () => {
			(mockQueue.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue([]);

			const result = await service.shouldStop(123);

			expect(result).toBe(true);
		});

		test("should return false if jobs exist for flow", async () => {
			(mockQueue.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue([
				{
					data: { flowId: 123, task: {} },
				},
			]);

			const result = await service.shouldStop(123);

			expect(result).toBe(false);
		});
	});

	describe("cleanQueue", () => {
		test("should remove all jobs for flow", async () => {
			const mockJob1 = {
				data: { flowId: 123 },
				remove: vi.fn().mockResolvedValue(undefined),
			};
			const mockJob2 = {
				data: { flowId: 456 },
				remove: vi.fn().mockResolvedValue(undefined),
			};
			const mockJob3 = {
				data: { flowId: 123 },
				remove: vi.fn().mockResolvedValue(undefined),
			};

			(mockQueue.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue([
				mockJob1,
				mockJob2,
				mockJob3,
			]);

			await service.cleanQueue(123);

			expect(mockJob1.remove).toHaveBeenCalled();
			expect(mockJob2.remove).not.toHaveBeenCalled();
			expect(mockJob3.remove).toHaveBeenCalled();
		});
	});

	describe("getQueueSize", () => {
		test("should return correct queue size for flow", async () => {
			(mockQueue.getJobs as ReturnType<typeof vi.fn>).mockResolvedValue([
				{ data: { flowId: 123 } },
				{ data: { flowId: 123 } },
				{ data: { flowId: 456 } },
			]);

			const size = await service.getQueueSize(123);

			expect(size).toBe(2);
		});
	});
});
