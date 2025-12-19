import { Injectable, Logger } from "@nestjs/common";
import type { SpanStatus } from "@opentelemetry/api";

// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { IEventAdapter } from "@/libs/event/adapter";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { ILogCreateAdapter } from "@/modules/log/adapter";
import type { ApiTracingInput } from "@/utils/request";
import type { FlowId } from "@/utils/types";

// biome-ignore lint/style/useImportType: used as Nest DI token
import { DockerService } from "./docker.service";

// Create a minimal mock tracing object for internal use
function createMockTracing(): ApiTracingInput {
  return {
    tracing: {
      span: {
        setStatus: () => {},
        addEvent: () => {},
        setAttribute: () => {},
        end: () => {},
      } as unknown as ApiTracingInput["tracing"]["span"],
      tracer: {} as unknown as ApiTracingInput["tracing"]["tracer"],
      tracerId: "",
      axios: () =>
        ({}) as unknown as ReturnType<ApiTracingInput["tracing"]["axios"]>,
      setStatus: (_status: SpanStatus) => {},
      logEvent: () => {},
      addAttribute: () => {},
      createSpan: () => ({}) as unknown as ApiTracingInput["tracing"]["span"],
      finish: () => {},
    },
    user: { id: "", email: "", name: "" },
  };
}

@Injectable()
export class TerminalService {
  private readonly logger = new Logger(TerminalService.name);

  constructor(
    private dockerService: DockerService,
    private logCreateUsecase: ILogCreateAdapter,
    private eventService: IEventAdapter,
  ) {}

  terminalName(flowId: FlowId): string {
    return `codel-terminal-${flowId}`;
  }

  async execCommand(
    flowId: FlowId,
    command: string,
    tracing: ApiTracingInput,
  ): Promise<string> {
    const containerName = this.terminalName(flowId);

    // Check if container is running
    const isRunning =
      await this.dockerService.isContainerRunning(containerName);
    if (!isRunning) {
      throw new Error("Container is not running");
    }

    // Execute command via DockerService (it handles logging)
    const result = await this.dockerService.execCommand(
      flowId,
      containerName,
      command,
      tracing,
    );

    return result || "Command executed successfully";
  }

  async writeFile(
    flowId: FlowId,
    content: string,
    filePath: string,
    tracing: ApiTracingInput,
  ): Promise<void> {
    const containerName = this.terminalName(flowId);

    // Check if container is running
    const isRunning =
      await this.dockerService.isContainerRunning(containerName);
    if (!isRunning) {
      throw new Error("Container is not running");
    }

    // Write file via DockerService (it handles logging)
    await this.dockerService.writeFile(
      flowId,
      containerName,
      content,
      filePath,
      tracing,
    );
  }

  async readFile(
    flowId: FlowId,
    filePath: string,
    tracing: ApiTracingInput,
  ): Promise<string> {
    const containerName = this.terminalName(flowId);

    // Check if container is running
    const isRunning =
      await this.dockerService.isContainerRunning(containerName);
    if (!isRunning) {
      throw new Error("Container is not running");
    }

    // Read file via DockerService (it handles logging)
    const result = await this.dockerService.readFile(
      flowId,
      containerName,
      filePath,
      tracing,
    );

    return result;
  }
}
