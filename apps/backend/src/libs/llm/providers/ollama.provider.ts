import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";

import {
  TaskEntity,
  TaskStatus,
  TaskType,
} from "@/core/task/entity/task";
import { ITemplateService } from "@/libs/template/adapter";

import { ILLMProvider } from "../adapter";
import { NextTaskOptions } from "../types";

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
  };
  format?: string;
}

interface Call {
  tool: string;
  tool_input: Record<string, string>;
  message: string;
}

@Injectable()
export class OllamaProvider implements ILLMProvider {
  private readonly logger = new Logger(OllamaProvider.name);
  private client: AxiosInstance | null = null;
  private model: string;
  private baseURL: string;

  constructor(
    private configService: ConfigService,
    private templateService: ITemplateService,
  ) {
    this.baseURL =
      this.configService.get<string>("app.providers.ollama.serverUrl") ||
      "http://localhost:11434";
    this.model =
      this.configService.get<string>("app.providers.ollama.model") ||
      "llama2";

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000,
    });
  }

  name(): string {
    return "ollama";
  }

  async summary(query: string, maxLength: number): Promise<string> {
    if (!this.client) {
      throw new Error("Ollama client not initialized");
    }

    const prompt = await this.templateService.renderPrompt("summary", {
      text: query,
      n: maxLength,
    });

    try {
      const response = await this.client.post<OllamaResponse>(
        "/api/generate",
        {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.0,
            top_p: 0.2,
          },
        } as OllamaGenerateRequest,
      );

      return response.data.response.trim();
    } catch (error) {
      this.logger.error(`Failed to generate summary: ${error}`);
      throw new Error(`Failed to generate summary: ${error}`);
    }
  }

  async dockerImageName(task: string): Promise<string> {
    if (!this.client) {
      throw new Error("Ollama client not initialized");
    }

    const prompt = await this.templateService.renderPrompt("docker", {
      task,
    });

    try {
      const response = await this.client.post<OllamaResponse>(
        "/api/generate",
        {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.0,
            top_p: 0.2,
          },
        } as OllamaGenerateRequest,
      );

      return response.data.response.trim() || "debian:latest";
    } catch (error) {
      this.logger.error(`Failed to get docker image name: ${error}`);
      return "debian:latest";
    }
  }

  async nextTask(options: NextTaskOptions): Promise<Partial<TaskEntity>> {
    if (!this.client) {
      throw new Error("Ollama client not initialized");
    }

    this.logger.log("Getting next task");

    const toolPlaceholder = this.getToolPlaceholder();

    const prompt = await this.templateService.renderPrompt("agent", {
      dockerImage: options.dockerImage,
      toolPlaceholder,
      tasks: options.tasks,
    });

    // TODO In case of lots of tasks, we should try to get a summary using gpt-3.5
    if (prompt.length > 30000) {
      this.logger.warn("Prompt too long, asking user");
      return this.defaultAskTask("My prompt is too long and I can't process it");
    }

    try {
      const messages = this.tasksToMessages(options.tasks, prompt);
      const fullPrompt = messages
        .map((msg) => {
          if (msg.role === "system") {
            return msg.content;
          }
          if (msg.role === "user") {
            return `User: ${msg.content}`;
          }
          if (msg.role === "assistant") {
            return `Assistant: ${msg.content}`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n\n");

      const response = await this.client.post<OllamaResponse>(
        "/api/generate",
        {
          model: this.model,
          prompt: fullPrompt,
          stream: false,
          format: "json",
          options: {
            temperature: 0.0,
            top_p: 0.2,
          },
        } as OllamaGenerateRequest,
      );

      const content = response.data.response.trim();

      if (!content) {
        this.logger.warn("No content in response, asking user");
        return this.defaultAskTask("Looks like I couldn't find a task to run");
      }

      const task = this.textToTask(content);

      if (!task) {
        this.logger.error("Failed to convert text to task, asking user");
        return this.defaultAskTask(
          "There was an error getting the next task",
        );
      }

      return task;
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

  private getToolPlaceholder(): string {
    const tools = [
      {
        type: "function",
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
        type: "function",
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
        type: "function",
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
        type: "function",
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
        type: "function",
        function: {
          name: "done",
          description:
            "Mark the whole task as done. Should be called at the very end when everything is completed",
          parameters: {
            type: "object",
            properties: {
              summary: {
                type: "string",
                description: "Summary of completion",
              },
              message: { type: "string", description: "Final message" },
            },
            required: ["summary", "message"],
          },
        },
      },
    ];

    return `You have access to the following tools:

${JSON.stringify(tools, null, 2)}

To use a tool, respond with a JSON object with the following structure: 
{
  "tool": <name of the called tool>,
  "tool_input": <parameters for the tool matching the above JSON schema>,
  "message": <a message that will be displayed to the user>
}

Always use a tool. Always reply with valid JSON. Always include a message.`;
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
          content: JSON.stringify({
            tool: task.type,
            tool_input: task.args,
            message: task.message || "",
          }),
        });

        messages.push({
          role: "user",
          content: `Tool result: ${task.results || ""}`,
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

  private textToTask(text: string): Partial<TaskEntity> | null {
    this.logger.log(`Unmarshalling tool call: ${text}`);

    try {
      // Try to parse as JSON
      const call = JSON.parse(text) as Call;

      if (!call.tool) {
        this.logger.warn("No tool found in call");
        return null;
      }

      const task: Partial<TaskEntity> = {
        type: call.tool as TaskType,
        args: call.tool_input || {},
        message:
          call.message ||
          JSON.stringify(call.tool_input) ||
          "I need more information to proceed.",
        status: TaskStatus.IN_PROGRESS,
      };

      this.logger.log(`Unmarshalled tool call: ${JSON.stringify(task)}`);
      return task;
    } catch (error) {
      this.logger.error(`Failed to unmarshal tool call: ${error}`);
      return null;
    }
  }
}

