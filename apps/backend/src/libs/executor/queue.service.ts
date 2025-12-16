import { Injectable } from "@nestjs/common";

import type { TaskEntity } from "@/core/task/entity/task";
import type { FlowId } from "@/utils/types";

@Injectable()
export class QueueService {
	private queues: Map<FlowId, TaskEntity[]> = new Map();
	private stopSignals: Map<FlowId, boolean> = new Map();

	addQueue(flowId: FlowId): void {
		if (!this.queues.has(flowId)) {
			this.queues.set(flowId, []);
			this.stopSignals.set(flowId, false);
		}
	}

	addTask(flowId: FlowId, task: TaskEntity): void {
		const queue = this.queues.get(flowId);
		if (queue) {
			queue.push(task);
		}
	}

	getNextTask(flowId: FlowId): TaskEntity | undefined {
		const queue = this.queues.get(flowId);
		return queue?.shift();
	}

	shouldStop(flowId: FlowId): boolean {
		return this.stopSignals.get(flowId) || false;
	}

	cleanQueue(flowId: FlowId): void {
		this.stopSignals.set(flowId, true);
		this.queues.delete(flowId);
		this.stopSignals.delete(flowId);
	}

	getQueueSize(flowId: FlowId): number {
		return this.queues.get(flowId)?.length || 0;
	}
}
