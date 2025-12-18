import { InjectQueue } from "@nestjs/bull";
import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { Queue } from "bull";

import type { TaskEntity } from "@/core/task/entity/task";
import type { FlowId } from "@/utils/types";

export const EXECUTOR_QUEUE = "executor";

@Injectable()
export class QueueService implements OnModuleInit {
	constructor(@InjectQueue(EXECUTOR_QUEUE) private queue: Queue) {}

	async onModuleInit(): Promise<void> {
		// Queue is ready
	}

	async addQueue(_flowId: FlowId): Promise<void> {
		// Queue is created per flow, but Bull handles this automatically
		// We can add a marker job if needed
	}

	async addTask(flowId: FlowId, task: TaskEntity): Promise<void> {
		await this.queue.add(
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
	}

	async getNextTask(flowId: FlowId): Promise<TaskEntity | null> {
		// Bull processes jobs automatically, but we can peek at the next job
		const jobs = await this.queue.getJobs(["waiting", "active"], 0, 1);
		const job = jobs.find((j) => j.data.flowId === flowId);
		return job?.data.task || null;
	}

	async shouldStop(flowId: FlowId): Promise<boolean> {
		// Check if there are any jobs for this flow
		const jobs = await this.queue.getJobs(["waiting", "active", "delayed"]);
		return !jobs.some((j) => j.data.flowId === flowId);
	}

	async cleanQueue(flowId: FlowId): Promise<void> {
		// Remove all jobs for this flow
		const jobs = await this.queue.getJobs([
			"waiting",
			"active",
			"delayed",
			"failed",
		]);
		for (const job of jobs) {
			if (job.data.flowId === flowId) {
				await job.remove();
			}
		}
	}

	async getQueueSize(flowId: FlowId): Promise<number> {
		const jobs = await this.queue.getJobs(["waiting", "active", "delayed"]);
		return jobs.filter((j) => j.data.flowId === flowId).length;
	}

	getQueue(): Queue {
		return this.queue;
	}
}
