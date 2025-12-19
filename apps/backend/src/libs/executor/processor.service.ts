import { Injectable, Logger } from "@nestjs/common";
import  { SpanStatus } from "@opentelemetry/api";

import  { FlowStatus } from "@/core/flow/entity/flow";
import { LogType } from "@/core/log/entity/log";
import  { LogCreateUsecase } from "@/core/log/use-cases/log-create";
import {  TaskEntity, TaskStatus, TaskType } from "@/core/task/entity/task";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { IEventAdapter } from "@/libs/event/adapter";
import { EventNameEnum } from "@/libs/event/types";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { ILLMProvider } from "@/libs/llm/adapter";
import  { ApiTracingInput } from "@/utils/request";
import  { FlowId } from "@/utils/types";

// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { IExecutorRepository } from "./adapter";
import  { BrowserService } from "./browser.service";
import  { DockerService } from "./docker.service";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { QueueService } from "./queue.service";
import { TerminalService } from "./terminal.service";

const MAX_RESULTS_LENGTH = 4000;

// Create a minimal mock tracing object for internal use
function createMockTracing(): ApiTracingInput {
	return {
		tracing: {
			span: {
				setStatus: () => {},
				addEvent: () => {},
				setAttribute: () => {},
				end: () => {},
			} as unknown as ApiTracingInput["tracing"]["span"],
			tracer: {} as unknown as ApiTracingInput["tracing"]["tracer"],
			tracerId: "",
			axios: () =>
				({}) as unknown as ReturnType<ApiTracingInput["tracing"]["axios"]>,
			setStatus: (_status: SpanStatus) => {},
			logEvent: () => {},
			addAttribute: () => {},
			createSpan: () => ({}) as unknown as ApiTracingInput["tracing"]["span"],
			finish: () => {},
		},
		user: { id: "", email: "", name: "" },
	};
}

@Injectable()
export class ProcessorService {
	private readonly logger = new Logger(ProcessorService.name);
	private readonly tracing: ApiTracingInput = createMockTracing();

	constructor(
		private executorRepository: IExecutorRepository,
		private llmProvider: ILLMProvider,
		private queueService: QueueService,
		private eventService: IEventAdapter,
		private dockerService: DockerService,
		private terminalService: TerminalService,
		private browserService: BrowserService,
		private logCreateUsecase: LogCreateUsecase,
	) {}

	async startProcessing(flowId: FlowId, tracing: ApiTracingInput): Promise<void> {
		await this.queueService.addQueue(flowId);
		this.logger.log(`Starting task processor for flow ${flowId}`);

		// Process tasks in background
		setImmediate(() => this.processQueue(flowId, tracing));
	}

	private async processQueue(
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<void> {
		const flow = await this.executorRepository.getFlow(flowId);
		if (!flow) {
			this.logger.error(`Flow ${flowId} not found`);
			return;
		}

		while (!(await this.queueService.shouldStop(flowId))) {
			const task = await this.queueService.getNextTask(flowId);

			if (!task) {
				// No tasks in queue, wait a bit
				await new Promise((resolve) => setTimeout(resolve, 100));
				continue;
			}

			this.logger.log(`Processing task ${task.id} of type ${task.type}`);

			// Broadcast task added
			this.eventService.emit(EventNameEnum.TASK_UPDATE, {
				flowId: Number(flowId),
				taskId: task.id,
			});

			try {
				await this.processTask(task, flowId, tracing);

				// Get next task from LLM if not done or ask
				if (task.type !== TaskType.DONE && task.type !== TaskType.ASK) {
					const nextTask = await this.getNextTask(flowId, tracing);
					if (nextTask) {
						await this.queueService.addTask(flowId, nextTask);
					}
				}
			} catch (error) {
				this.logger.error(
					`Error processing task ${task.id}: ${error instanceof Error ? error.message : String(error)}`,
				);
				await this.executorRepository.updateTaskStatus(
					task.id,
					TaskStatus.FAILED,
					tracing,
				);
			}
		}

		this.logger.log(`Stopped task processor for flow ${flowId}`);
	}

	private async processTask(
		task: TaskEntity,
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<void> {
		// Mark as in progress
		await this.executorRepository.updateTaskStatus(
			task.id,
			TaskStatus.IN_PROGRESS,
			tracing,
		);

		const args = (task.args ?? {}) as Record<string, unknown>;

		switch (task.type) {
			case TaskType.INPUT:
				await this.processInputTask(task, flowId, tracing);
				break;

			case TaskType.TERMINAL:
				await this.processTerminalTask(task, flowId, tracing);
				break;

			case TaskType.BROWSER:
				await this.processBrowserTask(task, flowId, tracing);
				break;

			case TaskType.CODE:
				await this.processCodeTask(task, flowId, tracing);
				break;

			case TaskType.ASK:
				await this.processAskTask(task, tracing);
				break;

			case TaskType.DONE:
				await this.processDoneTask(task, flowId, tracing);
				break;

			default:
				await this.executorRepository.updateTaskStatus(
					task.id,
					TaskStatus.FINISHED,
					tracing,
				);
		}

		// Send task update via Event
		if (task.flowId) {
			this.eventService.emit(EventNameEnum.TASK_UPDATE, {
				flowId: Number(task.flowId),
				taskId: task.id,
			});
		}
	}

	private async processInputTask(
		task: TaskEntity,
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<void> {
		const tasks = await this.executorRepository.getTasks(flowId);

		// This is the first task in the flow - initialize flow
		if (tasks.length === 1) {
			await this.initializeFlow(task, flowId, tracing);
		}

		await this.executorRepository.updateTaskStatus(
			task.id,
			TaskStatus.FINISHED,
			tracing,
		);
	}

	private async initializeFlow(
		task: TaskEntity,
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<void> {
		const message = task.message || "";

		// Get summary and docker image from LLM
		const summary = await this.llmProvider.summary(message, 10);
		const dockerImage = await this.llmProvider.dockerImageName(message);

		// Update flow name
		const flow = await this.executorRepository.updateFlowName(
			flowId,
			summary,
			tracing,
		);

		// Broadcast flow update
		this.eventService.emit(EventNameEnum.FLOW_UPDATE, {
			flowId: Number(flowId),
			status: flow.status,
		});

		// Create system log
		const initMessage = `Initializing the docker image ${dockerImage}...`;
		await this.logCreateUsecase.execute(
			{
				message: initMessage,
				type: LogType.OUTPUT,
				flowId: Number(flowId),
			},
			tracing,
		);

		this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
			flowId: Number(flowId),
			content: this.formatTerminalSystemOutput(initMessage),
		});

		// Spawn container
		const containerName = this.terminalService.terminalName(flowId);
		const container = await this.dockerService.spawnContainer(
			flowId,
			{
				name: containerName,
				image: dockerImage,
				cmd: ["tail", "-f", "/dev/null"],
			},
			tracing,
		);

		// Update flow with container ID
		// Note: container.id is UUID string, but FlowEntity.containerId is number
		// We need to get the numeric ID from the database container record
		// For now, we'll need to convert or look it up
		const containerEntity = await this.executorRepository.getContainerById(
			Number(container.id) || 0,
		);
		if (containerEntity) {
			// Extract numeric ID from container entity if available
			// This is a workaround - ideally container.id should be the numeric DB ID
			await this.executorRepository.updateFlowContainer(
				flowId,
				Number(container.id) || 0,
				tracing,
			);
		}

		// Broadcast flow update with connected terminal
		this.eventService.emit(EventNameEnum.FLOW_UPDATE, {
			flowId: Number(flowId),
			status: flow.status,
		});

		// Create success log
		const successMessage = "Container initialized. Ready to execute commands.";
		await this.logCreateUsecase.execute(
			{
				message: successMessage,
				type: LogType.OUTPUT,
				flowId: Number(flowId),
			},
			tracing,
		);

		this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
			flowId: Number(flowId),
			content: this.formatTerminalSystemOutput(successMessage),
		});
	}

	private async processTerminalTask(
		task: TaskEntity,
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<void> {
		const args = (task.args ?? {}) as Record<string, unknown>;
		const command = typeof args.command === "string" ? args.command : "";

		if (!command) {
			throw new Error("Command is required for terminal task");
		}

		const results = await this.terminalService.execCommand(flowId, command, tracing);
		const truncatedResults = this.truncateResults(results);

		await this.executorRepository.updateTaskResults(
			task.id,
			truncatedResults,
			tracing,
		);

		await this.executorRepository.updateTaskStatus(
			task.id,
			TaskStatus.FINISHED,
			tracing,
		);
	}

	private async processBrowserTask(
		task: TaskEntity,
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<void> {
		const args = (task.args ?? {}) as Record<string, unknown>;
		const url = typeof args.url === "string" ? args.url : "";
		const action = typeof args.action === "string" ? args.action : "read";

		if (!url) {
			throw new Error("URL is required for browser task");
		}

		let results: string;
		let screenshotName: string;

		if (action === "read") {
			const content = await this.browserService.getContent(flowId, url, tracing);
			results = content;
			screenshotName = ""; // Browser service doesn't return screenshot name in current impl
		} else if (action === "urls") {
			const urls = await this.browserService.getUrls(flowId, url, tracing);
			results = JSON.stringify(urls);
			screenshotName = "";
		} else {
			throw new Error(`Unknown browser action: ${action}`);
		}

		const truncatedResults = this.truncateResults(results);

		await this.executorRepository.updateTaskResults(
			task.id,
			truncatedResults,
			tracing,
		);

		await this.executorRepository.updateTaskStatus(
			task.id,
			TaskStatus.FINISHED,
			tracing,
		);

		// Broadcast browser update
		this.eventService.emit(EventNameEnum.BROWSER_UPDATE, {
			flowId: Number(flowId),
			url,
			screenshotUrl: screenshotName ? `http://localhost:8080/browser/${screenshotName}` : undefined,
		});
	}

	private async processCodeTask(
		task: TaskEntity,
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<void> {
		const args = (task.args ?? {}) as Record<string, unknown>;
		const action = typeof args.action === "string" ? args.action : "read";
		const path = typeof args.path === "string" ? args.path : "";
		const content = typeof args.content === "string" ? args.content : "";

		let results = "";

		if (action === "read") {
			// Read file from container
			results = await this.terminalService.readFile(flowId, path, tracing);
		} else if (action === "write" || action === "update") {
			// Write file to container
			await this.terminalService.writeFile(flowId, content, path, tracing);
			results = `Modified file: ${path}`;
		} else {
			throw new Error(`Unknown code action: ${action}`);
		}

		const truncatedResults = this.truncateResults(results);

		await this.executorRepository.updateTaskResults(
			task.id,
			truncatedResults,
			tracing,
		);

		await this.executorRepository.updateTaskStatus(
			task.id,
			TaskStatus.FINISHED,
			tracing,
		);
	}

	private async processAskTask(
		task: TaskEntity,
		tracing: ApiTracingInput,
	): Promise<void> {
		// Wait for user input
		await this.executorRepository.updateTaskStatus(
			task.id,
			TaskStatus.IN_PROGRESS,
			tracing,
		);
	}

	private async processDoneTask(
		task: TaskEntity,
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<void> {
		await this.executorRepository.finishFlow(flowId, tracing);

		this.eventService.emit(EventNameEnum.FLOW_UPDATE, {
			flowId: Number(flowId),
			status: FlowStatus.FINISHED,
		});

		await this.executorRepository.updateTaskStatus(
			task.id,
			TaskStatus.FINISHED,
			tracing,
		);
	}

	private async getNextTask(
		flowId: FlowId,
		tracing: ApiTracingInput,
	): Promise<TaskEntity | null> {
		const flow = await this.executorRepository.getFlow(flowId);
		if (!flow) {
			throw new Error(`Flow ${flowId} not found`);
		}

		const tasks = await this.executorRepository.getTasks(flowId);

		// Truncate results for LLM
		const truncatedTasks = tasks.map((t) => ({
			...t,
			results: this.truncateResults(t.results),
		}));

		// Get container image for LLM context
		let dockerImage = "ubuntu:22.04";
		if (flow.containerId) {
			const container = await this.executorRepository.getContainerById(
				flow.containerId,
			);
			if (container?.image) {
				dockerImage = container.image;
			}
		}

		const nextTaskData = await this.llmProvider.nextTask({
			tasks: truncatedTasks as TaskEntity[],
			dockerImage,
		});

		const nextTask = await this.executorRepository.createTask(
			{
				flowId: String(flowId),
				type: (nextTaskData.type ?? TaskType.ASK) as TaskEntity["type"],
				message: nextTaskData.message ?? "",
				args: nextTaskData.args,
				toolCallId: nextTaskData.toolCallId ?? null,
			},
			tracing,
		);

		return nextTask;
	}

	private truncateResults(results: string): string {
		if (results.length <= MAX_RESULTS_LENGTH) {
			return results;
		}
		// Keep the last MAX_RESULTS_LENGTH characters
		return results.slice(-MAX_RESULTS_LENGTH);
	}

	private formatTerminalSystemOutput(text: string): string {
		const cyan = "\u001b[36m";
		const reset = "\u001b[0m";
		return `${cyan}${text}${reset}\r\n`;
	}

	async stopProcessing(flowId: FlowId): Promise<void> {
		await this.queueService.cleanQueue(flowId);
		this.logger.log(`Stopped processing for flow ${flowId}`);
	}
}
