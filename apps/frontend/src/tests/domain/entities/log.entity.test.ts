import { Log } from "@/core/domain/entities/log.entity";
import { describe, expect, it } from "vitest";

describe("Log Entity", () => {
  describe("constructor", () => {
    it("should create a log with required properties", () => {
      const log = new Log("1", "Test log message");

      expect(log.id).toBe("1");
      expect(log.text).toBe("Test log message");
      expect(log.flowId).toBeNull();
    });

    it("should create a log with optional flowId", () => {
      const log = new Log("1", "Test log message", "flow-1");

      expect(log.flowId).toBe("flow-1");
    });
  });

  describe("isEmpty", () => {
    it("should return true for empty text", () => {
      const log = new Log("1", "");
      expect(log.isEmpty()).toBe(true);
    });

    it("should return true for whitespace-only text", () => {
      const log = new Log("1", "   ");
      expect(log.isEmpty()).toBe(true);
    });

    it("should return false for non-empty text", () => {
      const log = new Log("1", "Hello");
      expect(log.isEmpty()).toBe(false);
    });
  });

  describe("getPlainText", () => {
    it("should remove ANSI escape codes", () => {
      const log = new Log("1", "\x1b[32mGreen text\x1b[0m");
      expect(log.getPlainText()).toBe("Green text");
    });

    it("should handle text without ANSI codes", () => {
      const log = new Log("1", "Plain text");
      expect(log.getPlainText()).toBe("Plain text");
    });

    it("should handle multiple ANSI codes", () => {
      const log = new Log("1", "\x1b[1m\x1b[33mBold Yellow\x1b[0m");
      expect(log.getPlainText()).toBe("Bold Yellow");
    });
  });

  describe("toJSON", () => {
    it("should return a serializable object", () => {
      const log = new Log("1", "Test message", "flow-1");
      const json = log.toJSON();

      expect(json).toHaveProperty("id", "1");
      expect(json).toHaveProperty("text", "Test message");
      expect(json).toHaveProperty("flowId", "flow-1");
      expect(json).toHaveProperty("createdAt");
    });
  });
});
