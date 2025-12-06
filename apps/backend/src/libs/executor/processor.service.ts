import { Injectable, Logger } from "@nestjs/common";

import { TaskStatus } from "@/core/task/entity/task";
import type { IEventAdapter } from "@/libs/event/adapter";
import { EventNameEnum } from "@/libs/event/types";
import type { ILLMProvider } from "@/libs/llm/adapter";

import type { IExecutorRepository } from "./adapter";
import type { QueueService } from "./queue.service";

@Injectable()
export class ProcessorService {
	private readonly logger = new Logger(ProcessorService.name);

	constructor(
		private executorRepository: IExecutorRepository,
		private llmProvider: ILLMProvider,
		private queueService: QueueService,
		private eventService: IEventAdapter,
	) {}

	async startProcessing(flowId: number): Promise<void> {
		this.queueService.addQueue(flowId);
		this.logger.log(`Starting task processor for flow ${flowId}`);

		// Process tasks in background
		setImmediate(() => this.processQueue(flowId));
	}

	private async processQueue(flowId: number): Promise<void> {
		while (!this.queueService.shouldStop(flowId)) {
			const task = this.queueService.getNextTask(flowId);

			if (!task) {
				// No tasks in queue, wait a bit
				await new Promise((resolve) => setTimeout(resolve, 100));
				continue;
			}

			this.logger.log(`Processing task ${task.id} of type ${task.type}`);

			try {
				await this.processTask(task);

				// Get next task from LLM if not done
				if (task.type !== "done" && task.type !== "ask") {
					const flow = await this.executorRepository.getFlow(flowId);
					if (!flow) {
						throw new Error(`Flow ${flowId} not found`);
					}

					const tasks = await this.executorRepository.getTasks(flowId);

					const nextTaskData = await this.llmProvider.nextTask({
						tasks,
						dockerImage: "ubuntu:22.04", // TODO: Get from flow/container
					});

					const nextTask = await this.executorRepository.createTask({
						flowId,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						type: (nextTaskData.type || "ask") as any,
						message: nextTaskData.message || "",
						args: nextTaskData.args,
					});

					this.queueService.addTask(flowId, nextTask);
				}
			} catch (error) {
				this.logger.error(`Error processing task ${task.id}:`, error);
				await this.executorRepository.updateTaskStatus(
					task.id,
					TaskStatus.FAILED,
				);
			}
		}

		this.logger.log(`Stopped task processor for flow ${flowId}`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private async processTask(task: any): Promise<void> {
		// Mark as in progress
		await this.executorRepository.updateTaskStatus(
			task.id,
			TaskStatus.IN_PROGRESS,
		);

		// Simulate processing based on task type
		switch (task.type) {
			case "input":
				// Input tasks are already complete
				await this.executorRepository.updateTaskStatus(
					task.id,
					TaskStatus.FINISHED,
				);
				break;

			case "terminal": {
				// Simplified: just mark as finished
				// Real implementation would execute command in Docker container
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const terminalResult = `Command executed: ${(task.args as any).command}`;

				// Send terminal output via Event
				if (task.flowId) {
					this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
						flowId: task.flowId,
						content: terminalResult,
					});
				}

				await this.executorRepository.updateTaskResults(
					task.id,
					terminalResult,
				);
				break;
			}

			case "browser": {
				// Simplified: mark as finished
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const browserResult = `Browsed: ${(task.args as any).url}`;
				await this.executorRepository.updateTaskResults(task.id, browserResult);
				break;
			}

			case "code": {
				// Simplified: mark as finished
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const codeResult = `Modified file: ${(task.args as any).file}`;
				await this.executorRepository.updateTaskResults(task.id, codeResult);
				break;
			}

			case "ask":
				// Wait for user input
				await this.executorRepository.updateTaskStatus(
					task.id,
					TaskStatus.IN_PROGRESS,
				);
				break;

			case "done":
				// Mark flow as finished
				if (task.flowId) {
					await this.executorRepository.finishFlow(task.flowId);
					this.eventService.emit(EventNameEnum.FLOW_UPDATE, {
						flowId: task.flowId,
						status: "finished",
					});
				}
				await this.executorRepository.updateTaskStatus(
					task.id,
					TaskStatus.FINISHED,
				);
				break;

			default:
				await this.executorRepository.updateTaskStatus(
					task.id,
					TaskStatus.FINISHED,
				);
		}

		// Send task update via Event
		if (task.flowId) {
			// We need to fetch the updated task to send it
			// But for now we just emit the task id and let the gateway fetch it or we send the task object
			// The gateway expects the full task object
			// Let's assume the gateway will handle it or we fetch it here
			// For efficiency, we might want to return the updated task from updateTaskStatus/Results
			// But our interface returns void.
			// Let's emit the event and let the listener handle it
			this.eventService.emit(EventNameEnum.TASK_UPDATE, {
				flowId: task.flowId,
				taskId: task.id,
			});
		}
	}

	async stopProcessing(flowId: number): Promise<void> {
		this.queueService.cleanQueue(flowId);
		this.logger.log(`Stopped processing for flow ${flowId}`);
	}
}
