import { BaseEntity } from "./base.entity";

/**
 * Log entity representing terminal output or system messages
 */
export class Log extends BaseEntity {
  constructor(
    id: string,
    public readonly text: string,
    public readonly flowId: string | null = null,
    createdAt?: Date
  ) {
    super(id, createdAt);
  }

  /**
   * Check if the log is empty
   */
  isEmpty(): boolean {
    return !this.text || this.text.trim().length === 0;
  }

  /**
   * Get the text content without ANSI escape codes
   */
  getPlainText(): string {
    // Remove ANSI escape codes
    return this.text.replace(/\x1b\[[0-9;]*m/g, "");
  }

  /**
   * Convert to a plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      flowId: this.flowId,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
