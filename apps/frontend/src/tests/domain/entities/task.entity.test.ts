import { Task } from "@/core/domain/entities/task.entity";
import { TaskStatus, TaskType } from "@/core/domain/types";
import { describe, expect, it } from "vitest";

describe("Task Entity", () => {
  describe("constructor", () => {
    it("should create a task with required properties", () => {
      const task = new Task(
        "1",
        TaskType.Ask,
        "Test message",
        TaskStatus.InProgress
      );

      expect(task.id).toBe("1");
      expect(task.type).toBe(TaskType.Ask);
      expect(task.message).toBe("Test message");
      expect(task.status).toBe(TaskStatus.InProgress);
      expect(task.args).toEqual({});
      expect(task.results).toEqual({});
      expect(task.flowId).toBeNull();
    });

    it("should create a task with optional properties", () => {
      const args = { key: "value" };
      const results = { output: "result" };

      const task = new Task(
        "1",
        TaskType.Terminal,
        "Test message",
        TaskStatus.Finished,
        args,
        results,
        "flow-1"
      );

      expect(task.args).toEqual(args);
      expect(task.results).toEqual(results);
      expect(task.flowId).toBe("flow-1");
    });
  });

  describe("isRunning", () => {
    it("should return true when status is inProgress", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.InProgress);
      expect(task.isRunning()).toBe(true);
    });

    it("should return false when status is finished", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.Finished);
      expect(task.isRunning()).toBe(false);
    });
  });

  describe("isComplete", () => {
    it("should return true when status is finished", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.Finished);
      expect(task.isComplete()).toBe(true);
    });

    it("should return true when status is failed", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.Failed);
      expect(task.isComplete()).toBe(true);
    });

    it("should return true when status is stopped", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.Stopped);
      expect(task.isComplete()).toBe(true);
    });

    it("should return false when status is inProgress", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.InProgress);
      expect(task.isComplete()).toBe(false);
    });
  });

  describe("hasFailed", () => {
    it("should return true when status is failed", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.Failed);
      expect(task.hasFailed()).toBe(true);
    });

    it("should return false when status is not failed", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.Finished);
      expect(task.hasFailed()).toBe(false);
    });
  });

  describe("task type helpers", () => {
    it("isBrowserTask should return true for browser type", () => {
      const task = new Task("1", TaskType.Browser, "Test", TaskStatus.InProgress);
      expect(task.isBrowserTask()).toBe(true);
    });

    it("isTerminalTask should return true for terminal type", () => {
      const task = new Task("1", TaskType.Terminal, "Test", TaskStatus.InProgress);
      expect(task.isTerminalTask()).toBe(true);
    });

    it("isInputTask should return true for input type", () => {
      const task = new Task("1", TaskType.Input, "Test", TaskStatus.InProgress);
      expect(task.isInputTask()).toBe(true);
    });

    it("isInputTask should return true for ask type", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.InProgress);
      expect(task.isInputTask()).toBe(true);
    });
  });

  describe("copyWith", () => {
    it("should create a new task with updated properties", () => {
      const original = new Task("1", TaskType.Ask, "Original", TaskStatus.InProgress);
      const updated = original.copyWith({
        message: "Updated",
        status: TaskStatus.Finished
      });

      expect(updated.message).toBe("Updated");
      expect(updated.status).toBe(TaskStatus.Finished);
      expect(updated.id).toBe(original.id);
      expect(updated.type).toBe(original.type);
      expect(updated).not.toBe(original);
    });
  });

  describe("toJSON", () => {
    it("should return a serializable object", () => {
      const task = new Task("1", TaskType.Code, "Test", TaskStatus.InProgress);
      const json = task.toJSON();

      expect(json).toHaveProperty("id", "1");
      expect(json).toHaveProperty("type", TaskType.Code);
      expect(json).toHaveProperty("message", "Test");
      expect(json).toHaveProperty("status", TaskStatus.InProgress);
      expect(json).toHaveProperty("createdAt");
    });
  });
});
