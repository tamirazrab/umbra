import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { LogType } from "@/core/log/entity/log";
import type { IEventAdapter } from "@/libs/event/adapter";
import { EventNameEnum } from "@/libs/event/types";
import type { ILogCreateAdapter } from "@/modules/log/adapter";
import { mockFn, mockTracing } from "../../../../test/mock";
import { BrowserService } from "../browser.service";

// Mock playwright
vi.mock("playwright", () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        goto: vi.fn().mockResolvedValue(undefined),
        content: vi.fn().mockResolvedValue("<html><body>Test Content</body></html>"),
        evaluate: vi.fn().mockResolvedValue(["http://example.com/1", "http://example.com/2"]),
        screenshot: vi.fn().mockResolvedValue(Buffer.from("screenshot-data")),
        close: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  },
}));

describe(BrowserService.name, () => {
  let service: BrowserService;
  let eventService: IEventAdapter;
  let logCreateUsecase: ILogCreateAdapter;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        BrowserService,
        {
          provide: IEventAdapter,
          useValue: {
            emit: mockFn(),
          },
        },
        {
          provide: ILogCreateAdapter,
          useValue: {
            execute: mockFn(),
          },
        },
      ],
    }).compile();

    service = app.get(BrowserService);
    eventService = app.get(IEventAdapter);
    logCreateUsecase = app.get(ILogCreateAdapter);

    // Manually call onModuleInit as it's not called automatically in unit tests
    await service.onModuleInit();
  });

  test("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getContent", () => {
    test("should get content from URL", async () => {
      const flowId = 123;
      const url = "http://test.com";
      const content = await service.getContent(flowId, url, mockTracing());

      expect(content).toBe("<html><body>Test Content</body></html>");
      expect(logCreateUsecase.execute).toHaveBeenCalledWith(
        { flowId, message: `Browsed URL: ${url}`, type: LogType.INPUT },
        mockTracing(),
      );
      expect(eventService.emit).toHaveBeenCalledWith(EventNameEnum.BROWSER_UPDATE, {
        flowId,
        url,
        content: "<html><body>Test Content</body></html>",
      });
    });

    test("should throw error if browser not initialized", async () => {
      (service as unknown as { browser: null }).browser = null;
      await expect(service.getContent(123, "http://test.com", mockTracing())).rejects.toThrow(
        "Browser not initialized",
      );
    });
  });

  describe("getUrls", () => {
    test("should get URLs from page", async () => {
      const flowId = 123;
      const url = "http://test.com";
      const urls = await service.getUrls(flowId, url, mockTracing());

      expect(urls).toEqual(["http://example.com/1", "http://example.com/2"]);
      expect(logCreateUsecase.execute).toHaveBeenCalledWith(
        { flowId, message: `Extracted URLs from: ${url}`, type: LogType.INPUT },
        mockTracing(),
      );
      expect(eventService.emit).toHaveBeenCalledWith(EventNameEnum.BROWSER_UPDATE, {
        flowId,
        url,
        urls: ["http://example.com/1", "http://example.com/2"],
      });
    });
  });

  describe("takeScreenshot", () => {
    test("should take a screenshot", async () => {
      const flowId = 123;
      const url = "http://test.com";
      const screenshot = await service.takeScreenshot(flowId, url, mockTracing());

      expect(screenshot).toEqual(Buffer.from("screenshot-data"));
      expect(logCreateUsecase.execute).toHaveBeenCalledWith(
        { flowId, message: `Took screenshot of: ${url}`, type: LogType.INPUT },
        mockTracing(),
      );
      expect(eventService.emit).toHaveBeenCalledWith(EventNameEnum.BROWSER_UPDATE, {
        flowId,
        url,
        screenshot: Buffer.from("screenshot-data").toString("base64"),
      });
    });
  });
});
