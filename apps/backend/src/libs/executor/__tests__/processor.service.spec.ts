import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ContainerEntity, ContainerStatus } from "@/core/container/entity/container";
import { FlowEntity, FlowStatus } from "@/core/flow/entity/flow";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { LogCreateUsecase } from "@/core/log/use-cases/log-create";
import { TaskEntity, TaskStatus, TaskType } from "@/core/task/entity/task";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { IEventAdapter } from "@/libs/event/adapter";
import { EventNameEnum } from "@/libs/event/types";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { ILLMProvider } from "@/libs/llm/adapter";
import { getUUID, mockFn, mockTracing } from "../../../../test/mock";

// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { IExecutorRepository } from "../adapter";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { BrowserService } from "../browser.service";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { DockerService } from "../docker.service";
import { ProcessorService } from "../processor.service";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { QueueService } from "../queue.service";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { TerminalService } from "../terminal.service";
import { FlowId } from "@/utils/types";

describe(ProcessorService.name, () => {
  let service: ProcessorService;
  let executorRepository: IExecutorRepository;
  let llmProvider: ILLMProvider;
  let queueService: QueueService;
  let eventService: IEventAdapter;
  let dockerService: DockerService;
  let terminalService: TerminalService;
  let browserService: BrowserService;
  let logCreateUsecase: LogCreateUsecase;

  const mockFlowId = 123;
  const mockTracingInput = mockTracing();

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        ProcessorService,
        {
          provide: IExecutorRepository,
          useValue: {
            getFlow: mockFn(),
            getTasks: mockFn(),
            createTask: mockFn(),
            updateTaskStatus: mockFn(),
            updateTaskResults: mockFn(),
            updateTaskToolCallId: mockFn(),
            updateFlowName: mockFn(),
            updateFlowContainer: mockFn(),
            finishFlow: mockFn(),
            getContainerById: mockFn(),
          },
        },
        {
          provide: ILLMProvider,
          useValue: {
            name: mockFn(),
            summary: mockFn(),
            dockerImageName: mockFn(),
            nextTask: mockFn(),
          },
        },
        {
          provide: QueueService,
          useValue: {
            addQueue: mockFn(),
            addTask: mockFn(),
            getNextTask: mockFn(),
            shouldStop: mockFn(),
            cleanQueue: mockFn(),
          },
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: mockFn(),
          },
        },
        {
          provide: DockerService,
          useValue: {
            spawnContainer: mockFn(),
            execCommand: mockFn(),
            writeFile: mockFn(),
            readFile: mockFn(),
          },
        },
        {
          provide: TerminalService,
          useValue: {
            terminalName: mockFn(),
            execCommand: mockFn(),
            writeFile: mockFn(),
            readFile: mockFn(),
          },
        },
        {
          provide: BrowserService,
          useValue: {
            getContent: mockFn(),
            getUrls: mockFn(),
            takeScreenshot: mockFn(),
          },
        },
        {
          provide: LogCreateUsecase,
          useValue: {
            execute: vi.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = app.get(ProcessorService);
    executorRepository = app.get(IExecutorRepository);
    llmProvider = app.get(ILLMProvider);
    queueService = app.get(QueueService);
    eventService = app.get(IEventAdapter);
    dockerService = app.get(DockerService);
    terminalService = app.get(TerminalService);
    browserService = app.get(BrowserService);
    logCreateUsecase = app.get(LogCreateUsecase);
  });

  test("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("startProcessing", () => {
    test("should start processing flow", async () => {
      (queueService.addQueue as ReturnType<typeof mockFn>).mockResolvedValue(undefined);

      await service.startProcessing(mockFlowId, mockTracingInput);

      expect(queueService.addQueue).toHaveBeenCalledWith(mockFlowId);
    });
  });

  describe("processInputTask", () => {
    test("should initialize flow on first input task", async () => {
      const task = new TaskEntity({
        id: getUUID(),
        type: TaskType.INPUT,
        status: TaskStatus.IN_PROGRESS,
        args: {},
        results: "{}",
        message: "Create a React app",
        toolCallId: null,
        flowId: String(mockFlowId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const flow = new FlowEntity({
        id: getUUID(),
        name: null,
        status: FlowStatus.IN_PROGRESS,
        model: "gpt-4",
        modelProvider: "openai",
        containerId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const container = new ContainerEntity({
        id: getUUID(),
        name: "test-container",
        image: "node:18",
        status: ContainerStatus.RUNNING,
        localId: "docker-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (executorRepository.getTasks as ReturnType<typeof mockFn>).mockResolvedValue([task]);
      (executorRepository.getFlow as ReturnType<typeof mockFn>).mockResolvedValue(flow);
      (llmProvider.summary as ReturnType<typeof mockFn>).mockResolvedValue("Create React app");
      (llmProvider.dockerImageName as ReturnType<typeof mockFn>).mockResolvedValue("node:18");
      (executorRepository.updateFlowName as ReturnType<typeof mockFn>).mockResolvedValue(
        new FlowEntity({ ...flow, name: "Create React app" }),
      );
      (terminalService.terminalName as ReturnType<typeof mockFn>).mockReturnValue(
        "codel-terminal-123",
      );
      (dockerService.spawnContainer as ReturnType<typeof mockFn>).mockResolvedValue(container);
      (executorRepository.getContainerById as ReturnType<typeof mockFn>).mockResolvedValue(
        container,
      );
      (executorRepository.updateFlowContainer as ReturnType<typeof mockFn>).mockResolvedValue(
        new FlowEntity({ ...flow, containerId: 1 }),
      );
      (executorRepository.updateTaskStatus as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );

      // Access private method via type assertion for testing
      await (service as unknown as {
        processInputTask: (
          task: TaskEntity,
          flowId: FlowId,
          tracing: typeof mockTracingInput,
        ) => Promise<void>;
      }).processInputTask(task, mockFlowId, mockTracingInput);

      expect(llmProvider.summary).toHaveBeenCalledWith("Create a React app", 10);
      expect(llmProvider.dockerImageName).toHaveBeenCalledWith("Create a React app");
      expect(dockerService.spawnContainer).toHaveBeenCalled();
    });
  });

  describe("processTerminalTask", () => {
    test("should process terminal task successfully", async () => {
      const command = "ls -la";
      const task = new TaskEntity({
        id: getUUID(),
        type: TaskType.TERMINAL,
        status: TaskStatus.IN_PROGRESS,
        args: { command },
        results: "{}",
        message: "List files",
        toolCallId: null,
        flowId: String(mockFlowId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const terminalResult = "file1.txt\nfile2.txt";

      (terminalService.execCommand as ReturnType<typeof mockFn>).mockResolvedValue(
        terminalResult,
      );
      (executorRepository.updateTaskResults as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );
      (executorRepository.updateTaskStatus as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );

      await (service as unknown as {
        processTerminalTask: (
          task: TaskEntity,
          flowId: FlowId,
          tracing: typeof mockTracingInput,
        ) => Promise<void>;
      }).processTerminalTask(task, mockFlowId, mockTracingInput);

      expect(terminalService.execCommand).toHaveBeenCalledWith(
        mockFlowId,
        command,
        mockTracingInput,
      );
      expect(executorRepository.updateTaskResults).toHaveBeenCalled();
    });
  });

  describe("processBrowserTask", () => {
    test("should process browser task with read action", async () => {
      const url = "https://example.com";
      const task = new TaskEntity({
        id: getUUID(),
        type: TaskType.BROWSER,
        status: TaskStatus.IN_PROGRESS,
        args: { url, action: "read" },
        results: "{}",
        message: "Browse website",
        toolCallId: null,
        flowId: String(mockFlowId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const browserContent = "<html>...</html>";

      (browserService.getContent as ReturnType<typeof mockFn>).mockResolvedValue(
        browserContent,
      );
      (executorRepository.updateTaskResults as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );
      (executorRepository.updateTaskStatus as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );

      await (service as unknown as {
        processBrowserTask: (
          task: TaskEntity,
          flowId: FlowId,
          tracing: typeof mockTracingInput,
        ) => Promise<void>;
      }).processBrowserTask(task, mockFlowId, mockTracingInput);

      expect(browserService.getContent).toHaveBeenCalledWith(
        mockFlowId,
        url,
        mockTracingInput,
      );
      expect(executorRepository.updateTaskResults).toHaveBeenCalled();
    });

    test("should process browser task with urls action", async () => {
      const url = "https://example.com";
      const task = new TaskEntity({
        id: getUUID(),
        type: TaskType.BROWSER,
        status: TaskStatus.IN_PROGRESS,
        args: { url, action: "urls" },
        results: "{}",
        message: "Browse website",
        toolCallId: null,
        flowId: String(mockFlowId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const browserUrls = ["url1", "url2"];

      (browserService.getUrls as ReturnType<typeof mockFn>).mockResolvedValue(browserUrls);
      (executorRepository.updateTaskResults as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );
      (executorRepository.updateTaskStatus as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );

      await (service as unknown as {
        processBrowserTask: (
          task: TaskEntity,
          flowId: FlowId,
          tracing: typeof mockTracingInput,
        ) => Promise<void>;
      }).processBrowserTask(task, mockFlowId, mockTracingInput);

      expect(browserService.getUrls).toHaveBeenCalledWith(
        mockFlowId,
        url,
        mockTracingInput,
      );
      expect(executorRepository.updateTaskResults).toHaveBeenCalled();
    });
  });

  describe("processCodeTask", () => {
    test("should process code task with read action", async () => {
      const file = "/app/test.js";
      const task = new TaskEntity({
        id: getUUID(),
        type: TaskType.CODE,
        status: TaskStatus.IN_PROGRESS,
        args: { action: "read", path: file },
        results: "{}",
        message: "Read file",
        toolCallId: null,
        flowId: String(mockFlowId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const fileContent = "file content";

      (terminalService.readFile as ReturnType<typeof mockFn>).mockResolvedValue(fileContent);
      (executorRepository.updateTaskResults as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );
      (executorRepository.updateTaskStatus as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );

      await (service as unknown as {
        processCodeTask: (
          task: TaskEntity,
          flowId: FlowId,
          tracing: typeof mockTracingInput,
        ) => Promise<void>;
      }).processCodeTask(task, mockFlowId, mockTracingInput);

      expect(terminalService.readFile).toHaveBeenCalledWith(
        mockFlowId,
        file,
        mockTracingInput,
      );
      expect(executorRepository.updateTaskResults).toHaveBeenCalled();
    });

    test("should process code task with write action", async () => {
      const file = "/app/test.js";
      const code = "console.log('hello');";
      const task = new TaskEntity({
        id: getUUID(),
        type: TaskType.CODE,
        status: TaskStatus.IN_PROGRESS,
        args: { action: "write", path: file, content: code },
        results: "{}",
        message: "Write file",
        toolCallId: null,
        flowId: String(mockFlowId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (terminalService.writeFile as ReturnType<typeof mockFn>).mockResolvedValue(undefined);
      (executorRepository.updateTaskResults as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );
      (executorRepository.updateTaskStatus as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );

      await (service as unknown as {
        processCodeTask: (
          task: TaskEntity,
          flowId: FlowId,
          tracing: typeof mockTracingInput,
        ) => Promise<void>;
      }).processCodeTask(task, mockFlowId, mockTracingInput);

      expect(terminalService.writeFile).toHaveBeenCalledWith(
        mockFlowId,
        code,
        file,
        mockTracingInput,
      );
      expect(executorRepository.updateTaskResults).toHaveBeenCalled();
    });
  });

  describe("processDoneTask", () => {
    test("should finish flow when done task processed", async () => {
      const task = new TaskEntity({
        id: getUUID(),
        type: TaskType.DONE,
        status: TaskStatus.IN_PROGRESS,
        args: {},
        results: "{}",
        message: "Task completed",
        toolCallId: null,
        flowId: String(mockFlowId),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      (executorRepository.finishFlow as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );
      (executorRepository.updateTaskStatus as ReturnType<typeof mockFn>).mockResolvedValue(
        undefined,
      );

      await (service as unknown as {
        processDoneTask: (
          task: TaskEntity,
          flowId: FlowId,
          tracing: typeof mockTracingInput,
        ) => Promise<void>;
      }).processDoneTask(task, mockFlowId, mockTracingInput);

      expect(executorRepository.finishFlow).toHaveBeenCalledWith(
        mockFlowId,
        mockTracingInput,
      );
      expect(eventService.emit).toHaveBeenCalledWith(EventNameEnum.FLOW_UPDATE, {
        flowId: mockFlowId,
        status: FlowStatus.FINISHED,
      });
    });
  });

  describe("truncateResults", () => {
    test("should truncate results longer than max length", () => {
      const longResult = "a".repeat(5000);
      const truncated = (service as unknown as {
        truncateResults: (results: string) => string;
      }).truncateResults(longResult);

      expect(truncated.length).toBe(4000);
      expect(truncated).toBe("a".repeat(4000));
    });

    test("should not truncate results shorter than max length", () => {
      const shortResult = "short result";
      const result = (service as unknown as {
        truncateResults: (results: string) => string;
      }).truncateResults(shortResult);

      expect(result).toBe(shortResult);
    });
  });

  describe("stopProcessing", () => {
    test("should clean queue and log stop message", async () => {
      (queueService.cleanQueue as ReturnType<typeof mockFn>).mockResolvedValue(undefined);
      await service.stopProcessing(mockFlowId);
      expect(queueService.cleanQueue).toHaveBeenCalledWith(mockFlowId);
    });
  });
});
