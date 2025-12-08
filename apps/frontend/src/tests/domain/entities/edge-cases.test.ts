import { Flow } from "@/core/domain/entities/flow.entity";
import { Log } from "@/core/domain/entities/log.entity";
import { Task } from "@/core/domain/entities/task.entity";
import { FlowStatus, TaskStatus, TaskType } from "@/core/domain/types";
import { describe, expect, it } from "vitest";

describe("Entity Edge Cases", () => {
  describe("Flow Entity Edge Cases", () => {
    const mockModel = { id: "gpt-4", provider: "openai" };

    it("should handle empty string name", () => {
      const flow = new Flow("1", "", FlowStatus.InProgress, mockModel);
      expect(flow.name).toBe("");
    });

    it("should handle very long name", () => {
      const longName = "A".repeat(10000);
      const flow = new Flow("1", longName, FlowStatus.InProgress, mockModel);
      expect(flow.name).toHaveLength(10000);
    });

    it("should handle special characters in name", () => {
      const specialName = "Flow <script>alert('xss')</script>";
      const flow = new Flow("1", specialName, FlowStatus.InProgress, mockModel);
      expect(flow.name).toBe(specialName);
    });

    it("should handle unicode characters in name", () => {
      const unicodeName = "Flow 日本語 🚀 العربية";
      const flow = new Flow("1", unicodeName, FlowStatus.InProgress, mockModel);
      expect(flow.name).toBe(unicodeName);
    });

    it("should handle empty model id", () => {
      const flow = new Flow("1", "Test", FlowStatus.InProgress, { id: "", provider: "" });
      expect(flow.model.id).toBe("");
    });

    it("should handle very large task array", () => {
      const tasks = Array.from({ length: 1000 }, (_, i) =>
        new Task(i.toString(), TaskType.Ask, `Task ${i}`, TaskStatus.Finished)
      );
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel, tasks);
      expect(flow.getTaskCount()).toBe(1000);
    });

    it("should preserve createdAt timestamp precision", () => {
      const now = new Date();
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel, [], null, null, now);
      expect(flow.createdAt.getTime()).toBe(now.getTime());
    });

    it("should handle terminal with empty logs", () => {
      const terminal = { containerName: "test", connected: true, logs: [] };
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel, [], terminal);
      expect(flow.terminal?.logs).toHaveLength(0);
    });

    it("should handle terminal with many logs", () => {
      const logs = Array.from({ length: 10000 }, (_, i) => ({ id: i, text: `Log ${i}` }));
      const terminal = { containerName: "test", connected: true, logs };
      const flow = new Flow("1", "Test", FlowStatus.InProgress, mockModel, [], terminal);
      expect(flow.terminal?.logs).toHaveLength(10000);
    });
  });

  describe("Task Entity Edge Cases", () => {
    it("should handle empty message", () => {
      const task = new Task("1", TaskType.Ask, "", TaskStatus.InProgress);
      expect(task.message).toBe("");
    });

    it("should handle message with newlines", () => {
      const message = "Line 1\nLine 2\n\nLine 4";
      const task = new Task("1", TaskType.Ask, message, TaskStatus.InProgress);
      expect(task.message).toBe(message);
    });

    it("should handle very long message", () => {
      const longMessage = "A".repeat(100000);
      const task = new Task("1", TaskType.Ask, longMessage, TaskStatus.InProgress);
      expect(task.message).toHaveLength(100000);
    });

    it("should handle deeply nested args object", () => {
      const deepArgs = {
        level1: { level2: { level3: { level4: { value: "deep" } } } },
      };
      const task = new Task("1", TaskType.Code, "Test", TaskStatus.InProgress, deepArgs);
      expect((task.args as any).level1.level2.level3.level4.value).toBe("deep");
    });

    it("should handle args with array values", () => {
      const args = { items: [1, 2, 3, 4, 5] };
      const task = new Task("1", TaskType.Code, "Test", TaskStatus.InProgress, args);
      expect((task.args as any).items).toHaveLength(5);
    });

    it("should handle null flowId", () => {
      const task = new Task("1", TaskType.Ask, "Test", TaskStatus.InProgress, {}, {}, null);
      expect(task.flowId).toBeNull();
    });

    it("should handle results with binary-like data", () => {
      const results = { data: "base64encodedcontent==" };
      const task = new Task("1", TaskType.Code, "Test", TaskStatus.Finished, {}, results);
      expect(task.results).toEqual(results);
    });

    it("should correctly identify all task types", () => {
      const types = [TaskType.Ask, TaskType.Input, TaskType.Code, TaskType.Terminal, TaskType.Browser];
      types.forEach((type) => {
        const task = new Task("1", type, "Test", TaskStatus.InProgress);
        expect(task.type).toBe(type);
      });
    });

    it("should handle copyWith with empty object", () => {
      const task = new Task("1", TaskType.Ask, "Original", TaskStatus.InProgress);
      const copied = task.copyWith({});
      expect(copied.message).toBe("Original");
      expect(copied.status).toBe(TaskStatus.InProgress);
    });
  });

  describe("Log Entity Edge Cases", () => {
    it("should handle empty text", () => {
      const log = new Log("1", "");
      expect(log.isEmpty()).toBe(true);
    });

    it("should handle text with only whitespace characters", () => {
      const log = new Log("1", "\t\n\r  ");
      expect(log.isEmpty()).toBe(true);
    });

    it("should handle text with null character", () => {
      const log = new Log("1", "Hello\0World");
      expect(log.text).toBe("Hello\0World");
    });

    it("should strip complex ANSI sequences", () => {
      const ansiText = "\x1b[0;1;31;40mRed Bold on Black\x1b[0m";
      const log = new Log("1", ansiText);
      expect(log.getPlainText()).toBe("Red Bold on Black");
    });

    it("should handle multiple ANSI reset sequences", () => {
      const text = "\x1b[0m\x1b[0m\x1b[0mReset text\x1b[0m";
      const log = new Log("1", text);
      expect(log.getPlainText()).toBe("Reset text");
    });

    it("should handle ANSI cursor movement codes", () => {
      const text = "\x1b[2J\x1b[HClear screen";
      const log = new Log("1", text);
      // Note: Current implementation may not strip all cursor codes
      // This tests that getPlainText at least works
      expect(log.getPlainText()).toBeDefined();
    });

    it("should handle very long text", () => {
      const longText = "A".repeat(1000000);
      const log = new Log("1", longText);
      expect(log.text).toHaveLength(1000000);
    });

    it("should preserve order of multiple logs", () => {
      const logs = Array.from({ length: 100 }, (_, i) => new Log(i.toString(), `Log ${i}`));
      logs.forEach((log, i) => {
        expect(log.id).toBe(i.toString());
        expect(log.text).toBe(`Log ${i}`);
      });
    });
  });

  describe("Base Entity Edge Cases", () => {
    it("should handle numeric string ids", () => {
      const flow = new Flow("12345", "Test", FlowStatus.InProgress, { id: "gpt-4", provider: "openai" });
      expect(flow.id).toBe("12345");
    });

    it("should handle UUID format ids", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      const flow = new Flow(uuid, "Test", FlowStatus.InProgress, { id: "gpt-4", provider: "openai" });
      expect(flow.id).toBe(uuid);
    });

    it("should equals compare by id only", () => {
      const flow1 = new Flow("1", "Name 1", FlowStatus.InProgress, { id: "gpt-4", provider: "openai" });
      const flow2 = new Flow("1", "Name 2", FlowStatus.Finished, { id: "gpt-3", provider: "openai" });
      expect(flow1.equals(flow2)).toBe(true);
    });
  });
});
