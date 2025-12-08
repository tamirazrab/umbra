import type {
  Browser,
  FlowStatus,
  Model,
  Terminal,
} from "@/core/domain/types";
import { BaseEntity } from "./base.entity";
import type { Task } from "./task.entity";

/**
 * Flow entity representing an AI agent conversation session
 */
export class Flow extends BaseEntity {
  constructor(
    id: string,
    public readonly name: string,
    public readonly status: FlowStatus,
    public readonly model: Model,
    public readonly tasks: Task[] = [],
    public readonly terminal: Terminal | null = null,
    public readonly browser: Browser | null = null,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
  }

  /**
   * Check if the flow is currently in progress
   */
  isInProgress(): boolean {
    return this.status === "inProgress";
  }

  /**
   * Check if the flow has finished
   */
  isFinished(): boolean {
    return this.status === "finished";
  }

  /**
   * Get the count of tasks in this flow
   */
  getTaskCount(): number {
    return this.tasks.length;
  }

  /**
   * Create a new Flow instance with updated properties
   */
  copyWith(props: Partial<Omit<Flow, "id" | "createdAt">>): Flow {
    return new Flow(
      this.id,
      props.name ?? this.name,
      props.status ?? this.status,
      props.model ?? this.model,
      props.tasks ?? this.tasks,
      props.terminal ?? this.terminal,
      props.browser ?? this.browser,
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
      name: this.name,
      status: this.status,
      model: this.model,
      tasks: this.tasks,
      terminal: this.terminal,
      browser: this.browser,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
