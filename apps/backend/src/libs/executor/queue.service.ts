import { Injectable } from "@nestjs/common";

import type { TaskEntity } from "@/core/task/entity/task";

@Injectable()
export class QueueService {
	private queues: Map<number, TaskEntity[]> = new Map();
	private stopSignals: Map<number, boolean> = new Map();

	addQueue(flowId: number): void {
		if (!this.queues.has(flowId)) {
			this.queues.set(flowId, []);
			this.stopSignals.set(flowId, false);
		}
	}

	addTask(flowId: number, task: TaskEntity): void {
		const queue = this.queues.get(flowId);
		if (queue) {
			queue.push(task);
		}
	}

	getNextTask(flowId: number): TaskEntity | undefined {
		const queue = this.queues.get(flowId);
		return queue?.shift();
	}

	shouldStop(flowId: number): boolean {
		return this.stopSignals.get(flowId) || false;
	}

	cleanQueue(flowId: number): void {
		this.stopSignals.set(flowId, true);
		this.queues.delete(flowId);
		this.stopSignals.delete(flowId);
	}

	getQueueSize(flowId: number): number {
		return this.queues.get(flowId)?.length || 0;
	}
}
