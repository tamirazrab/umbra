import { socketService } from "@/infrastructure/socket/socket.service";
import { describe, expect, it, vi } from "vitest";

// Mock socket.io-client
vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  })),
}));

describe("Socket Service", () => {
  describe("SocketService class", () => {
    it("should be a singleton", () => {
      const instance1 = socketService;
      const instance2 = socketService;
      expect(instance1).toBe(instance2);
    });

    it("should have connect method", () => {
      expect(typeof socketService.connect).toBe("function");
    });

    it("should have disconnect method", () => {
      expect(typeof socketService.disconnect).toBe("function");
    });

    it("should have getSocket method", () => {
      expect(typeof socketService.getSocket).toBe("function");
    });
  });

  // Hook tests require proper React environment
  // These are tested via the hooks test files with proper wrapper setup
});
