import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { Task, TaskStatus as UmbraTaskStatus, TaskType as UmbraTaskType } from "@umbra/types";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TaskStatus, TaskType } from "@/core/task/entity/task";
import { ITemplateService } from "@/libs/template/adapter";

import { NextTaskOptions } from "../../types";
import { OpenAIProvider } from "../openai.provider";

describe(OpenAIProvider.name, () => {
  let provider: OpenAIProvider;
  let configService: ConfigService;
  let templateService: ITemplateService;
  let mockOpenAIClient: {
    chat: {
      completions: {
        create: ReturnType<typeof vi.fn>;
      };
    };
  };

  beforeEach(async () => {
    const mockCreate = vi.fn();
    mockOpenAIClient = {
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    };

    const app = await Test.createTestingModule({
      providers: [
        OpenAIProvider,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === "app.providers.openai.key") return "test-api-key";
              if (key === "app.providers.openai.serverUrl")
                return "https://api.openai.com/v1";
              if (key === "app.providers.openai.model")
                return "gpt-4-turbo-preview";
              return undefined;
            }),
          },
        },
        {
          provide: ITemplateService,
          useValue: {
            renderPrompt: vi.fn((template: string, data: unknown) => {
              if (template === "summary") {
                return Promise.resolve(
                  `Summarize in ${(data as { n: number }).n} chars: ${(data as { text: string }).text}`,
                );
              }
              if (template === "docker") {
                return Promise.resolve(
                  `Docker image for: ${(data as { task: string }).task}`,
                );
              }
              if (template === "agent") {
                return Promise.resolve(
                  `System prompt with dockerImage: ${(data as { dockerImage: string }).dockerImage}`,
                );
              }
              return Promise.resolve("");
            }),
          },
        },
      ],
    }).compile();

    provider = app.get(OpenAIProvider);
    configService = app.get(ConfigService);
    templateService = app.get(ITemplateService);

    // Set the mocked client
    // @ts-expect-error - accessing private property for test
    provider.client = mockOpenAIClient;
  });

  describe("name", () => {
    test("should return 'openai'", () => {
      expect(provider.name()).toBe("openai");
    });
  });

  describe("summary", () => {
    test("should generate summary using template", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "This is a summary",
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse as never,
      );

      const result = await provider.summary("Long text here", 100);

      expect(result).toBe("This is a summary");
      expect(templateService.renderPrompt).toHaveBeenCalledWith("summary", {
        text: "Long text here",
        n: 100,
      });
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: expect.stringContaining("100") }],
        max_tokens: 25,
        temperature: 0.0,
        top_p: 0.2,
      });
    });

    test("should throw error if client not initialized", async () => {
      const providerWithoutClient = new OpenAIProvider(
        configService,
        templateService,
      );
      // @ts-expect-error - accessing private property for test
      providerWithoutClient.client = null;

      await expect(providerWithoutClient.summary("test", 100)).rejects.toThrow(
        "OpenAI client not initialized",
      );
    });
  });

  describe("dockerImageName", () => {
    test("should get docker image name using template", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "node:18-alpine",
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse as never,
      );

      const result = await provider.dockerImageName("Build a Node.js app");

      expect(result).toBe("node:18-alpine");
      expect(templateService.renderPrompt).toHaveBeenCalledWith("docker", {
        task: "Build a Node.js app",
      });
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledWith({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "user", content: expect.stringContaining("Node.js") },
        ],
        max_tokens: 50,
        temperature: 0.0,
        top_p: 0.2,
      });
    });

    test("should return default image if response is empty", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: "",
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse as never,
      );

      const result = await provider.dockerImageName("test task");

      expect(result).toBe("debian:latest");
    });
  });

  describe("nextTask", () => {
    test("should return task from tool call", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_123",
                  type: "function",
                  function: {
                    name: "terminal",
                    arguments: JSON.stringify({
                      command: "ls -la",
                      message: "Listing files",
                    }),
                  },
                },
              ],
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse as never,
      );

      const options: NextTaskOptions = {
        tasks: [],
        dockerImage: "node:latest",
      };

      const result = await provider.nextTask(options);

      expect(result.type).toBe(TaskType.TERMINAL);
      expect(result.args).toEqual({
        command: "ls -la",
        message: "Listing files",
      });
      expect(result.message).toBe("Listing files");
      expect(result.toolCallId).toBe("call_123");
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    test("should return ask task if no tool calls", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              tool_calls: [],
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse as never,
      );

      const options: NextTaskOptions = {
        tasks: [],
        dockerImage: "node:latest",
      };

      const result = await provider.nextTask(options);

      expect(result.type).toBe(TaskType.ASK);
      expect(result.message).toContain("What should I do next?");
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    test("should return ask task if prompt too long", async () => {
      vi.spyOn(templateService, "renderPrompt").mockResolvedValue(
        "x".repeat(30001),
      );

      const options: NextTaskOptions = {
        tasks: [],
        dockerImage: "node:latest",
      };

      const result = await provider.nextTask(options);

      expect(result.type).toBe(TaskType.ASK);
      expect(result.message).toContain("too long");
      expect(mockOpenAIClient.chat.completions.create).not.toHaveBeenCalled();
    });

    test("should handle error and return ask task", async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error("API Error"),
      );

      const options: NextTaskOptions = {
        tasks: [],
        dockerImage: "node:latest",
      };

      const result = await provider.nextTask(options);

      expect(result.type).toBe(TaskType.ASK);
      expect(result.message).toContain("error getting the next task");
    });

    test("should convert tasks to messages correctly", async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              tool_calls: [
                {
                  id: "call_456",
                  type: "function",
                  function: {
                    name: "code",
                    arguments: JSON.stringify({
                      file: "test.js",
                      code: "console.log('test')",
                      message: "Creating test file",
                    }),
                  },
                },
              ],
            },
          },
        ],
      };

      mockOpenAIClient.chat.completions.create.mockResolvedValue(
        mockResponse as never,
      );

      const options: NextTaskOptions = {
        tasks: [
          {
            id: 1,
            type: UmbraTaskType.Input,
            message: "User input",
            args: {},
            results: {},
            status: UmbraTaskStatus.Finished,
            createdAt: new Date().toISOString(),
            flowId: 1,
          },
          {
            id: 2,
            type: UmbraTaskType.Terminal,
            message: "Running command",
            args: { command: "ls" },
            results: { output: "file1.txt" },
            status: UmbraTaskStatus.Finished,
            createdAt: new Date().toISOString(),
            flowId: 1,
          },
        ] as Task[],
        dockerImage: "node:latest",
      };

      await provider.nextTask(options);

      const callArgs = mockOpenAIClient.chat.completions.create.mock.calls[0]?.[0];
      expect(callArgs).toBeDefined();
      expect(callArgs?.messages).toBeDefined();
      expect(callArgs?.messages.length).toBeGreaterThan(1);
    });
  });
});

