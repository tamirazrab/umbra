import { Flow } from "@/core/domain/entities/flow.entity";
import { Task } from "@/core/domain/entities/task.entity";
import { FlowStatus, TaskStatus, TaskType } from "@/core/domain/types";
import { describe, expect, it } from "vitest";

describe("Flow Entity", () => {
  const mockModel = { id: "gpt-4", provider: "openai" };
  const mockTask = new Task(
    "1",
    TaskType.Ask,
    "Test message",
    TaskStatus.Finished,
    {},
    {},
    "1"
  );

  describe("constructor", () => {
    it("should create a flow with required properties", () => {
      const flow = new Flow(
        "1",
        "Test Flow",
        FlowStatus.InProgress,
        mockModel
      );

      expect(flow.id).toBe("1");
      expect(flow.name).toBe("Test Flow");
      expect(flow.status).toBe(FlowStatus.InProgress);
      expect(flow.model).toEqual(mockModel);
      expect(flow.tasks).toEqual([]);
      expect(flow.terminal).toBeNull();
      expect(flow.browser).toBeNull();
    });

    it("should create a flow with optional properties", () => {
      const terminal = { containerName: "test-container", connected: true, logs: [] };
      const browser = { url: "https://example.com", screenshotUrl: "/screenshot.png" };

      const flow = new Flow(
        "1",
        "Test Flow",
        FlowStatus.Finished,
        mockModel,
        [mockTask],
        terminal,
        browser
      );

      expect(flow.tasks).toHaveLength(1);
      expect(flow.terminal).toEqual(terminal);
      expect(flow.browser).toEqual(browser);
    });
  });

  describe("isInProgress", () => {
    it("should return true when status is inProgress", () => {
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel);
      expect(flow.isInProgress()).toBe(true);
    });

    it("should return false when status is finished", () => {
      const flow = new Flow("1", "Test", FlowStatus.Finished, mockModel);
      expect(flow.isInProgress()).toBe(false);
    });
  });

  describe("isFinished", () => {
    it("should return true when status is finished", () => {
      const flow = new Flow("1", "Test", FlowStatus.Finished, mockModel);
      expect(flow.isFinished()).toBe(true);
    });

    it("should return false when status is inProgress", () => {
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel);
      expect(flow.isFinished()).toBe(false);
    });
  });

  describe("getTaskCount", () => {
    it("should return 0 for empty tasks", () => {
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel);
      expect(flow.getTaskCount()).toBe(0);
    });

    it("should return correct count for tasks", () => {
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel, [
        mockTask,
        mockTask,
      ]);
      expect(flow.getTaskCount()).toBe(2);
    });
  });

  describe("copyWith", () => {
    it("should create a new flow with updated properties", () => {
      const original = new Flow("1", "Original", FlowStatus.InProgress, mockModel);
      const updated = original.copyWith({ name: "Updated", status: FlowStatus.Finished });

      expect(updated.name).toBe("Updated");
      expect(updated.status).toBe(FlowStatus.Finished);
      expect(updated.id).toBe(original.id);
      expect(updated).not.toBe(original);
    });
  });

  describe("toJSON", () => {
    it("should return a serializable object", () => {
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel);
      const json = flow.toJSON();

      expect(json).toHaveProperty("id", "1");
      expect(json).toHaveProperty("name", "Test");
      expect(json).toHaveProperty("status", FlowStatus.InProgress);
      expect(json).toHaveProperty("createdAt");
      expect(json).toHaveProperty("updatedAt");
    });
  });

  describe("equals", () => {
    it("should return true for entities with same id", () => {
      const flow1 = new Flow("1", "Flow 1", FlowStatus.InProgress, mockModel);
      const flow2 = new Flow("1", "Flow 2", FlowStatus.Finished, mockModel);

      expect(flow1.equals(flow2)).toBe(true);
    });

    it("should return false for entities with different ids", () => {
      const flow1 = new Flow("1", "Flow 1", FlowStatus.InProgress, mockModel);
      const flow2 = new Flow("2", "Flow 2", FlowStatus.InProgress, mockModel);

      expect(flow1.equals(flow2)).toBe(false);
    });
  });
});
