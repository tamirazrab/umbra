import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { TaskStatus, TaskType } from "@/core/task/entity/task";
import { ITemplateService } from "@/libs/template/adapter";

import { NextTaskOptions } from "../../types";
import { OllamaProvider } from "../ollama.provider";

describe(OllamaProvider.name, () => {
	let provider: OllamaProvider;
	let configService: ConfigService;
	let templateService: ITemplateService;
	let mockAxiosInstance: {
		post: ReturnType<typeof vi.fn>;
	};

	beforeEach(async () => {
		const mockPost = vi.fn();
		mockAxiosInstance = {
			post: mockPost,
		};

		const app = await Test.createTestingModule({
			providers: [
				OllamaProvider,
				{
					provide: ConfigService,
					useValue: {
						get: vi.fn((key: string, defaultValue?: string) => {
							if (key === "app.providers.ollama.serverUrl")
								return "http://localhost:11434";
							if (key === "app.providers.ollama.model") return "llama2";
							return defaultValue;
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

		provider = app.get(OllamaProvider);
		configService = app.get(ConfigService);
		templateService = app.get(ITemplateService);

		// Set the mocked client
		// @ts-expect-error - accessing private property for test
		provider.client = mockAxiosInstance;
	});

	describe("name", () => {
		test("should return 'ollama'", () => {
			expect(provider.name()).toBe("ollama");
		});
	});

	describe("summary", () => {
		test("should generate summary using template", async () => {
			const mockResponse = {
				data: {
					response: "This is a summary",
					model: "llama2",
					created_at: "2024-01-01T00:00:00Z",
					done: true,
				},
			};

			mockAxiosInstance.post.mockResolvedValue(mockResponse);

			const result = await provider.summary("Long text here", 100);

			expect(result).toBe("This is a summary");
			expect(templateService.renderPrompt).toHaveBeenCalledWith("summary", {
				text: "Long text here",
				n: 100,
			});
			expect(mockAxiosInstance.post).toHaveBeenCalledWith(
				"/api/generate",
				expect.objectContaining({
					model: "llama2",
					prompt: expect.stringContaining("100"),
					stream: false,
					options: {
						temperature: 0.0,
						top_p: 0.2,
					},
				}),
			);
		});

		test("should throw error if client not initialized", async () => {
			const providerWithoutClient = new OllamaProvider(
				configService,
				templateService,
			);
			// @ts-expect-error - accessing private property for test
			providerWithoutClient.client = null;

			await expect(providerWithoutClient.summary("test", 100)).rejects.toThrow(
				"Ollama client not initialized",
			);
		});

		test("should handle API errors", async () => {
			mockAxiosInstance.post.mockRejectedValue(new Error("API Error"));

			await expect(provider.summary("test", 100)).rejects.toThrow(
				"Failed to generate summary",
			);
		});
	});

	describe("dockerImageName", () => {
		test("should get docker image name using template", async () => {
			const mockResponse = {
				data: {
					response: "node:18-alpine",
					model: "llama2",
					created_at: "2024-01-01T00:00:00Z",
					done: true,
				},
			};

			mockAxiosInstance.post.mockResolvedValue(mockResponse);

			const result = await provider.dockerImageName("Build a Node.js app");

			expect(result).toBe("node:18-alpine");
			expect(templateService.renderPrompt).toHaveBeenCalledWith("docker", {
				task: "Build a Node.js app",
			});
		});

		test("should return default image if response is empty", async () => {
			const mockResponse = {
				data: {
					response: "",
					model: "llama2",
					created_at: "2024-01-01T00:00:00Z",
					done: true,
				},
			};

			mockAxiosInstance.post.mockResolvedValue(mockResponse);

			const result = await provider.dockerImageName("test task");

			expect(result).toBe("debian:latest");
		});

		test("should return default image on error", async () => {
			mockAxiosInstance.post.mockRejectedValue(new Error("API Error"));

			const result = await provider.dockerImageName("test task");

			expect(result).toBe("debian:latest");
		});
	});

	describe("nextTask", () => {
		test("should return task from JSON response", async () => {
			const mockResponse = {
				data: {
					response: JSON.stringify({
						tool: "terminal",
						tool_input: {
							command: "ls -la",
							message: "Listing files",
						},
						message: "Listing files",
					}),
					model: "llama2",
					created_at: "2024-01-01T00:00:00Z",
					done: true,
				},
			};

			mockAxiosInstance.post.mockResolvedValue(mockResponse);

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
			expect(result.status).toBe(TaskStatus.IN_PROGRESS);
		});

		test("should return ask task if JSON parsing fails", async () => {
			const mockResponse = {
				data: {
					response: "Invalid JSON response",
					model: "llama2",
					created_at: "2024-01-01T00:00:00Z",
					done: true,
				},
			};

			mockAxiosInstance.post.mockResolvedValue(mockResponse);

			const options: NextTaskOptions = {
				tasks: [],
				dockerImage: "node:latest",
			};

			const result = await provider.nextTask(options);

			expect(result.type).toBe(TaskType.ASK);
			expect(result.message).toContain("error getting the next task");
		});

		test("should return ask task if response is empty", async () => {
			const mockResponse = {
				data: {
					response: "",
					model: "llama2",
					created_at: "2024-01-01T00:00:00Z",
					done: true,
				},
			};

			mockAxiosInstance.post.mockResolvedValue(mockResponse);

			const options: NextTaskOptions = {
				tasks: [],
				dockerImage: "node:latest",
			};

			const result = await provider.nextTask(options);

			expect(result.type).toBe(TaskType.ASK);
			expect(result.message).toContain("couldn't find a task");
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
			expect(mockAxiosInstance.post).not.toHaveBeenCalled();
		});

		test("should handle error and return ask task", async () => {
			mockAxiosInstance.post.mockRejectedValue(new Error("API Error"));

			const options: NextTaskOptions = {
				tasks: [],
				dockerImage: "node:latest",
			};

			const result = await provider.nextTask(options);

			expect(result.type).toBe(TaskType.ASK);
			expect(result.message).toContain("error getting the next task");
		});

		test("should handle ask task type", async () => {
			const mockResponse = {
				data: {
					response: JSON.stringify({
						tool: "ask",
						tool_input: {},
						message: "What should I do?",
					}),
					model: "llama2",
					created_at: "2024-01-01T00:00:00Z",
					done: true,
				},
			};

			mockAxiosInstance.post.mockResolvedValue(mockResponse);

			const options: NextTaskOptions = {
				tasks: [],
				dockerImage: "node:latest",
			};

			const result = await provider.nextTask(options);

			expect(result.type).toBe(TaskType.ASK);
			expect(result.message).toBe("What should I do?");
		});
	});
});

