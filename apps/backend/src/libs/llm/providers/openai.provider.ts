import { Injectable } from "@nestjs/common";
import  { ConfigService } from "@nestjs/config";
import OpenAI from "openai";

import  { TaskEntity } from "@/core/task/entity/task";

import  { ILLMProvider } from "../adapter";
import  { NextTaskOptions } from "../types";

@Injectable()
export class OpenAIProvider implements ILLMProvider {
	private client: OpenAI | null = null;
	private model: string;

	constructor(private configService: ConfigService) {
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

		const response = await this.client.chat.completions.create({
			model: this.model,
			messages: [
				{
					role: "system",
					content: `Summarize the following text in at most ${maxLength} characters.`,
				},
				{ role: "user", content: query },
			],
			max_tokens: Math.floor(maxLength / 4),
		});

		return response.choices[0]?.message?.content || "";
	}

	async dockerImageName(task: string): Promise<string> {
		if (!this.client) {
			throw new Error("OpenAI client not initialized");
		}

		const response = await this.client.chat.completions.create({
			model: this.model,
			messages: [
				{
					role: "system",
					content:
						"Determine the best Docker image for this task. Common options: python:3.9-slim, node:18-alpine, ubuntu:22.04. Return only the image name.",
				},
				{ role: "user", content: task },
			],
			max_tokens: 50,
		});

		return response.choices[0]?.message?.content?.trim() || "ubuntu:22.04";
	}

	async nextTask(options: NextTaskOptions): Promise<Partial<TaskEntity>> {
		if (!this.client) {
			throw new Error("OpenAI client not initialized");
		}

		const messages = this.tasksToMessages(options.tasks);

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
					description: "Mark the whole task as done",
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

		const response = await this.client.chat.completions.create({
			model: this.model,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			messages: messages as any,
			tools,
			tool_choice: "auto",
		});

		const choice = response.choices[0];
		if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
			const tool = choice.message.tool_calls[0];
			const args = JSON.parse(tool.function.arguments);

			return {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				type: tool.function.name as any,
				args,
				message: args.message || args.question || args.summary || "",
				toolCallId: tool.id,
			};
		}

		return {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			type: "ask" as any,
			message: "I need more information to proceed.",
			args: {},
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private tasksToMessages(tasks: TaskEntity[]): any[] {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const messages: any[] = [
			{
				role: "system",
				content:
					"You are an AI coding assistant. Help the user complete their coding tasks step by step.",
			},
		];

		for (const task of tasks) {
			if (task.type === "input") {
				messages.push({
					role: "user",
					content: task.message,
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
								name: task.type,
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
		}

		return messages;
	}
}
