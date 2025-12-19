import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import {
	TaskEntity,
	TaskStatus,
	TaskType,
} from "@/core/task/entity/task";
import { ITemplateService } from "@/libs/template/adapter";

import { ILLMProvider } from "../adapter";
import { NextTaskOptions } from "../types";

@Injectable()
export class OpenAIProvider implements ILLMProvider {
	private readonly logger = new Logger(OpenAIProvider.name);
	private client: OpenAI | null = null;
	private model: string;

	constructor(
		private configService: ConfigService,
		private templateService: ITemplateService,
	) {
		const apiKey = this.configService.get<string>("app.providers.openai.key");
		const serverUrl = this.configService.get<string>(
			"app.providers.openai.serverUrl",
		);
		this.model =
			this.configService.get<string>("app.providers.openai.model") ||
			"gpt-4-turbo-preview";

		if (apiKey) {
			this.client = new OpenAI({
				apiKey,
				baseURL: serverUrl,
			});
		}
	}

	name(): string {
		return "openai";
	}

	async summary(query: string, maxLength: number): Promise<string> {
		if (!this.client) {
			throw new Error("OpenAI client not initialized");
		}

		const prompt = await this.templateService.renderPrompt("summary", {
			text: query,
			n: maxLength,
		});

		const response = await this.client.chat.completions.create({
			model: this.model,
			messages: [{ role: "user", content: prompt }],
			max_tokens: Math.floor(maxLength / 4),
			temperature: 0.0,
			top_p: 0.2,
		});

		return response.choices[0]?.message?.content?.trim() || "";
	}

	async dockerImageName(task: string): Promise<string> {
		if (!this.client) {
			throw new Error("OpenAI client not initialized");
		}

		const prompt = await this.templateService.renderPrompt("docker", {
			task,
		});

		const response = await this.client.chat.completions.create({
			model: this.model,
			messages: [{ role: "user", content: prompt }],
			max_tokens: 50,
			temperature: 0.0,
			top_p: 0.2,
		});

		return response.choices[0]?.message?.content?.trim() || "debian:latest";
	}

	async nextTask(options: NextTaskOptions): Promise<Partial<TaskEntity>> {
		if (!this.client) {
			throw new Error("OpenAI client not initialized");
		}

		this.logger.log("Getting next task");

		const prompt = await this.templateService.renderPrompt("agent", {
			dockerImage: options.dockerImage,
			toolPlaceholder:
				"Always use your function calling functionality, instead of returning a text result.",
			tasks: options.tasks,
		});

		// TODO In case of lots of tasks, we should try to get a summary using gpt-3.5
		if (prompt.length > 30000) {
			this.logger.warn("Prompt too long, asking user");
			return this.defaultAskTask("My prompt is too long and I can't process it");
		}

		const messages = this.tasksToMessages(options.tasks, prompt);

		const tools = [
			{
				type: "function" as const,
				function: {
					name: "terminal",
					description: "Calls a terminal command",
					parameters: {
						type: "object",
						properties: {
							command: {
								type: "string",
								description: "The command to execute",
							},
							message: {
								type: "string",
								description: "Description of what the command does",
							},
						},
						required: ["command", "message"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "browser",
					description: "Opens a browser to look for additional information",
					parameters: {
						type: "object",
						properties: {
							url: { type: "string", description: "URL to navigate to" },
							message: { type: "string", description: "Purpose of browsing" },
						},
						required: ["url", "message"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "code",
					description: "Modifies or reads code files",
					parameters: {
						type: "object",
						properties: {
							file: { type: "string", description: "File path" },
							code: { type: "string", description: "Code content" },
							message: {
								type: "string",
								description: "Description of changes",
							},
						},
						required: ["file", "code", "message"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "ask",
					description:
						"Sends a question to the user for additional information",
					parameters: {
						type: "object",
						properties: {
							question: {
								type: "string",
								description: "Question for the user",
							},
							message: { type: "string", description: "Context" },
						},
						required: ["question", "message"],
					},
				},
			},
			{
				type: "function" as const,
				function: {
					name: "done",
					description:
						"Mark the whole task as done. Should be called at the very end when everything is completed",
					parameters: {
						type: "object",
						properties: {
							summary: { type: "string", description: "Summary of completion" },
							message: { type: "string", description: "Final message" },
						},
						required: ["summary", "message"],
					},
				},
			},
		];

		try {
			const response = await this.client.chat.completions.create({
				model: this.model,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				messages: messages as any,
				tools,
				tool_choice: "auto",
				temperature: 0.0,
				top_p: 0.2,
			});

			const choice = response.choices[0];
			if (
				choice?.message?.tool_calls &&
				choice.message.tool_calls.length > 0
			) {
				const toolCall = choice.message.tool_calls[0];
				if (
					toolCall &&
					toolCall.type === "function" &&
					"function" in toolCall &&
					toolCall.function
				) {
					const args = JSON.parse(toolCall.function.arguments);

					return {
						type: toolCall.function.name as TaskType,
						args,
						message: args.message || args.question || args.summary || "",
						toolCallId: toolCall.id,
						status: TaskStatus.IN_PROGRESS,
					};
				}
			}

			return this.defaultAskTask("I need more information to proceed.");
		} catch (error) {
			this.logger.error(`Failed to get response from model: ${error}`);
			return this.defaultAskTask("There was an error getting the next task");
		}
	}

	private defaultAskTask(message: string): Partial<TaskEntity> {
		return {
			type: TaskType.ASK,
			args: {},
			message: `${message}. What should I do next?`,
			status: TaskStatus.IN_PROGRESS,
		};
	}
	
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private tasksToMessages(tasks: TaskEntity[], prompt: string): any[] {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const messages: any[] = [
			{
				role: "system",
				content: prompt,
			},
		];

		for (const task of tasks) {
			if (task.type === "input") {
				messages.push({
					role: "user",
					content: task.message || "",
				});
			}

			if (task.toolCallId) {
				messages.push({
					role: "assistant",
					tool_calls: [
						{
							id: task.toolCallId,
							type: "function",
							function: {
								name: task.type || "",
								arguments: JSON.stringify(task.args),
							},
						},
					],
				});

				messages.push({
					role: "tool",
					tool_call_id: task.toolCallId,
					content: task.results || "",
				});
			}

			// This Ask was generated by the agent itself in case of some error (not the OpenAI)
			if (task.type === "ask" && !task.toolCallId) {
				messages.push({
					role: "assistant",
					content: task.message || "",
				});
			}
		}

		return messages;
	}
}
