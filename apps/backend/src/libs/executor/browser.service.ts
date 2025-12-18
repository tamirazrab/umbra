import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { type Browser, chromium } from "playwright";

import { LogType } from "@/core/log/entity/log";
import type { IEventAdapter } from "@/libs/event/adapter";
import { EventNameEnum } from "@/libs/event/types";
import type { ILogCreateAdapter } from "@/modules/log/adapter";
import type { ApiTracingInput } from "@/utils/request";
import type { FlowId } from "@/utils/types";

@Injectable()
export class BrowserService implements OnModuleInit {
  private readonly logger = new Logger(BrowserService.name);
  private browser: Browser | null = null;

  constructor(
    private eventService: IEventAdapter,
    private logCreateUsecase: ILogCreateAdapter,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      this.browser = await chromium.launch({ headless: true });
      this.logger.log("Playwright browser launched successfully");
    } catch (error) {
      this.logger.error(
        `Failed to launch Playwright browser: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async getContent(
    flowId: FlowId,
    url: string,
    tracing: ApiTracingInput,
  ): Promise<string> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    this.logger.log(`Getting content from ${url}`);
    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      const content = await page.content();

      await this.logCreateUsecase.execute(
        { flowId: Number(flowId), message: `Browsed URL: ${url}`, type: LogType.INPUT },
        tracing,
      );
      this.eventService.emit(EventNameEnum.BROWSER_UPDATE, {
        flowId: Number(flowId),
        url,
        content,
      });
      return content;
    } finally {
      await page.close();
    }
  }

  async getUrls(
    flowId: FlowId,
    url: string,
    tracing: ApiTracingInput,
  ): Promise<string[]> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    this.logger.log(`Getting URLs from ${url}`);
    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      const urls = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a"))
          .map((link) => link.href)
          .filter((href) => href && href.startsWith("http")),
      );

      await this.logCreateUsecase.execute(
        { flowId: Number(flowId), message: `Extracted URLs from: ${url}`, type: LogType.INPUT },
        tracing,
      );
      this.eventService.emit(EventNameEnum.BROWSER_UPDATE, {
        flowId: Number(flowId),
        url,
        urls,
      });
      return urls;
    } finally {
      await page.close();
    }
  }

  async takeScreenshot(
    flowId: FlowId,
    url: string,
    tracing: ApiTracingInput,
  ): Promise<Buffer> {
    if (!this.browser) {
      throw new Error("Browser not initialized");
    }

    this.logger.log(`Taking screenshot of ${url}`);
    const page = await this.browser.newPage();
    try {
      await page.goto(url, { waitUntil: "networkidle" });
      const screenshot = await page.screenshot({ fullPage: true });

      await this.logCreateUsecase.execute(
        { flowId: Number(flowId), message: `Took screenshot of: ${url}`, type: LogType.INPUT },
        tracing,
      );
      this.eventService.emit(EventNameEnum.BROWSER_UPDATE, {
        flowId: Number(flowId),
        url,
        screenshot: screenshot.toString("base64"),
      });
      return screenshot;
    } finally {
      await page.close();
    }
  }
}
