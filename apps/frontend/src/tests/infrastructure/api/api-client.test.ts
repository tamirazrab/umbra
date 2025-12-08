import { apiClient } from "@/infrastructure/api/api-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET requests", () => {
    it("should make GET request with correct headers", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });

      await apiClient.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Accept: "application/json",
          }),
        })
      );
    });

    it("should include auth token when present", async () => {
      localStorage.setItem("auth_token", "test-token-123");
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });

      await apiClient.get("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
        })
      );
    });

    it("should handle query parameters", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });

      await apiClient.get("/test", { params: { page: 1, limit: 10 } });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("page=1"),
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("limit=10"),
        expect.any(Object)
      );
    });

    it("should filter out undefined params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });

      await apiClient.get("/test", { params: { page: 1, limit: undefined } });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain("page=1");
      expect(calledUrl).not.toContain("limit");
    });
  });

  describe("POST requests", () => {
    it("should make POST request with JSON body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1 }),
      });

      const data = { name: "Test", value: 123 };
      await apiClient.post("/test", data);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(data),
        })
      );
    });

    it("should handle POST without body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await apiClient.post("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: undefined,
        })
      );
    });
  });

  describe("PUT requests", () => {
    it("should make PUT request with JSON body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ updated: true }),
      });

      const data = { status: "finished" };
      await apiClient.put("/test/1", data);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(data),
        })
      );
    });
  });

  describe("DELETE requests", () => {
    it("should make DELETE request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ deleted: true }),
      });

      await apiClient.delete("/test/1");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should throw error for non-ok response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: "Not found" }),
      });

      await expect(apiClient.get("/test")).rejects.toThrow("Not found");
    });

    it("should handle error without message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await expect(apiClient.get("/test")).rejects.toThrow("HTTP error! status: 500");
    });

    it("should handle JSON parse error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(apiClient.get("/test")).rejects.toThrow("Request failed");
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(apiClient.get("/test")).rejects.toThrow("Network error");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(null),
      });

      const result = await apiClient.get("/test");
      expect(result).toBeNull();
    });

    it("should handle array response", async () => {
      const arrayData = [{ id: 1 }, { id: 2 }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(arrayData),
      });

      const result = await apiClient.get("/test");
      expect(result).toEqual(arrayData);
    });

    it("should handle special characters in params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      });

      await apiClient.get("/test", { params: { query: "hello world & stuff" } });

      const calledUrl = mockFetch.mock.calls[0][0];
      // URLSearchParams uses + for spaces, %26 for &
      expect(calledUrl).toContain("hello+world");
      expect(calledUrl).toContain("%26");
    });
  });
});
