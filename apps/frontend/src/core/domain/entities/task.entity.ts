import type { TaskStatus, TaskType } from "@/core/domain/types";
import { BaseEntity } from "./base.entity";

/**
 * Task entity representing a single step/action in a Flow
 */
export class Task extends BaseEntity {
  constructor(
    id: string,
    public readonly type: TaskType,
    public readonly message: string,
    public readonly status: TaskStatus,
    public readonly args: Record<string, unknown> = {},
    public readonly results: Record<string, unknown> = {},
    public readonly flowId: string | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
  }

  /**
   * Check if task is currently running
   */
  isRunning(): boolean {
    return this.status === "inProgress";
  }

  /**
   * Check if task has completed (success or failure)
   */
  isComplete(): boolean {
    return this.status === "finished" || this.status === "failed" || this.status === "stopped";
  }

  /**
   * Check if task failed
   */
  hasFailed(): boolean {
    return this.status === "failed";
  }

  /**
   * Check if task is a browser action
   */
  isBrowserTask(): boolean {
    return this.type === "browser";
  }

  /**
   * Check if task is a terminal action
   */
  isTerminalTask(): boolean {
    return this.type === "terminal";
  }

  /**
   * Check if task is a user input request
   */
  isInputTask(): boolean {
    return this.type === "input" || this.type === "ask";
  }

  /**
   * Create a new Task instance with updated properties
   */
  copyWith(props: Partial<Omit<Task, "id" | "createdAt">>): Task {
    return new Task(
      this.id,
      props.type ?? this.type,
      props.message ?? this.message,
      props.status ?? this.status,
      props.args ?? this.args,
      props.results ?? this.results,
      props.flowId ?? this.flowId,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Convert to a plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      message: this.message,
      status: this.status,
      args: this.args,
      results: this.results,
      flowId: this.flowId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
