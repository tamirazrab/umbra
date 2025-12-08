import { BrowserPreview } from "@/components/features/browser-preview";
import { Panel } from "@/components/features/panel";
import { Terminal } from "@/components/features/terminal";
import { describe, expect, it } from "vitest";

// Simple component existence and export tests
// Full rendering tests require proper jsdom environment setup

describe("Feature Components Exports", () => {
  describe("Panel Component", () => {
    it("should be exported", () => {
      expect(Panel).toBeDefined();
      expect(typeof Panel).toBe("function");
    });
  });

  describe("Terminal Component", () => {
    it("should be exported", () => {
      expect(Terminal).toBeDefined();
      expect(typeof Terminal).toBe("function");
    });
  });

  describe("BrowserPreview Component", () => {
    it("should be exported", () => {
      expect(BrowserPreview).toBeDefined();
      expect(typeof BrowserPreview).toBe("function");
    });
  });
});
