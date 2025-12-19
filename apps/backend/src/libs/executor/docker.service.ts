import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Docker, { type ContainerCreateOptions, type ContainerInfo } from "dockerode";
import * as tar from "tar-stream";

import {
  ContainerEntity,
  ContainerStatus,
} from "@/core/container/entity/container";
import type { IContainerRepository } from "@/core/container/repository/container";
import { LogType } from "@/core/log/entity/log";
import type { IEventAdapter } from "@/libs/event/adapter";
import { EventNameEnum } from "@/libs/event/types";
import type { ILogCreateAdapter } from "@/modules/log/adapter";
import { ApiInternalServerException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { FlowId } from "@/utils/types";
import { UUIDUtils } from "@/utils/uuid";

export interface SpawnContainerOptions {
  name: string;
  image: string;
  cmd?: string[];
  exposedPorts?: Record<string, unknown>;
  portBindings?: Record<string, Array<{ HostIP: string; HostPort: string }>>;
}

@Injectable()
export class DockerService implements OnModuleInit {
  private readonly logger = new Logger(DockerService.name);
  private docker: Docker | null = null;
  private readonly defaultImage: string;

  constructor(
    private configService: ConfigService,
    private containerRepository: IContainerRepository,
    private logCreateUsecase: ILogCreateAdapter,
    private eventService: IEventAdapter,
  ) {
    this.defaultImage =
      this.configService.get<string>("app.docker.defaultImage") ||
      "debian:latest";
  }

  async onModuleInit(): Promise<void> {
    try {
      this.docker = new Docker({
        socketPath:
          this.configService.get<string>("app.docker.socketPath") ||
          "/var/run/docker.sock",
      });
      await this.docker.ping();
      const info = await this.docker.info();
      this.logger.log(
        `Docker client initialized: ${info.Name}, ${info.Architecture}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to initialize Docker client: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ApiInternalServerException("Failed to initialize Docker client", {
        originalError: error,
      });
    }
  }

  async spawnContainer(
    flowId: FlowId,
    options: SpawnContainerOptions,
    tracing: ApiTracingInput,
  ): Promise<ContainerEntity> {
    if (!this.docker) {
      throw new Error("Docker client not initialized");
    }

    const { name, image, cmd, exposedPorts, portBindings } = options;

    this.logger.log(`Spawning container ${image} "${name}"`);

    // Create container record in database
    const dbContainer = await this.containerRepository.create(
      new ContainerEntity({
        id: UUIDUtils.create(),
        name,
        image,
        status: ContainerStatus.STARTING,
        localId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    let localContainerId = "";

    try {
      // Check if image exists locally
      const images = await this.docker.listImages({
        filters: { reference: [image] },
      });
      const imageExistsLocally = images.length > 0;

      this.logger.log(`Image ${image} found locally: ${imageExistsLocally}`);

      // Pull image if not exists
      if (!imageExistsLocally) {
        this.logger.log(`Pulling image ${image}...`);
        try {
          await new Promise<void>((resolve, reject) => {
            this.docker?.pull(image, {}, (err, stream) => {
              if (err) {
                reject(err);
                return;
              }

              if (!stream) {
                reject(new Error("Failed to get pull stream"));
                return;
              }

              this.docker?.modem.followProgress(stream, (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve();
                }
              });
            });
          });
        } catch (error) {
          this.logger.warn(
            `Error pulling image: ${error instanceof Error ? error.message : String(error)}. Using default image ${this.defaultImage}`,
          );
          options.image = this.defaultImage;
        }
      }

      // Create container config
      const containerConfig: ContainerCreateOptions = {
        Image: options.image,
        Cmd: cmd || ["tail", "-f", "/dev/null"],
        ExposedPorts: (exposedPorts as Record<string, {}>) || {},
        HostConfig: {
          PortBindings: portBindings || {},
        },
      };

      // Create container
      this.logger.log(`Creating container ${name}...`);
      const container = await this.docker.createContainer({
        ...containerConfig,
        name,
      });

      localContainerId = container.id;
      this.logger.log(`Container ${name} created`);

      // Start container
      await container.start();
      this.logger.log(`Container ${name} started`);

      // Update container status to running
      await this.containerRepository.updateOne(
        { id: dbContainer.id },
        {
          localId: localContainerId,
          status: ContainerStatus.RUNNING,
        },
      );

      // Log container spawn
      await this.logCreateUsecase.execute(
        {
          message: `Container ${name} spawned successfully`,
          type: LogType.OUTPUT,
          flowId: Number(flowId),
        },
        tracing,
      );

      return new ContainerEntity({
        ...dbContainer,
        localId: localContainerId,
        status: ContainerStatus.RUNNING,
      });
    } catch (error) {
      this.logger.error(
        `Failed to spawn container: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Update container status to failed
      await this.containerRepository.updateOne(
        { id: dbContainer.id },
        {
          localId: localContainerId || null,
          status: ContainerStatus.FAILED,
        },
      );

      // Try to stop container if it was created
      if (localContainerId) {
        try {
          await this.stopContainer(localContainerId, dbContainer.id, tracing);
        } catch (stopError) {
          this.logger.warn(
            `Error stopping failed container: ${stopError instanceof Error ? stopError.message : String(stopError)}`,
          );
        }
      }

      throw new ApiInternalServerException(
        `Failed to spawn container ${name}`,
        { originalError: error },
      );
    }
  }

  async stopContainer(
    localContainerId: string,
    dbContainerId: string,
    tracing: ApiTracingInput,
  ): Promise<void> {
    if (!this.docker) {
      throw new Error("Docker client not initialized");
    }

    this.logger.log(`Stopping container ${localContainerId}...`);

    try {
      const container = this.docker.getContainer(localContainerId);
      await container.stop();
      this.logger.log(`Container ${localContainerId} stopped`);

      await this.containerRepository.updateOne(
        { id: dbContainerId },
        { status: ContainerStatus.STOPPED },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("No such container")
      ) {
        this.logger.log(
          `Container ${localContainerId} not found. Marking it as stopped.`,
        );
        await this.containerRepository.updateOne(
          { id: dbContainerId },
          { status: ContainerStatus.STOPPED },
        );
        return;
      }
      throw error;
    }
  }

  async deleteContainer(
    localContainerId: string,
    dbContainerId: string,
    tracing: ApiTracingInput,
  ): Promise<void> {
    if (!this.docker) {
      throw new Error("Docker client not initialized");
    }

    this.logger.log(`Deleting container ${localContainerId}...`);

    // Stop container first
    await this.stopContainer(localContainerId, dbContainerId, tracing);

    // Remove container
    try {
      const container = this.docker.getContainer(localContainerId);
      await container.remove();
      this.logger.log(`Container ${localContainerId} removed`);
    } catch (error) {
      throw new Error(
        `Error removing container: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async isContainerRunning(containerName: string): Promise<boolean> {
    if (!this.docker) {
      throw new Error("Docker client not initialized");
    }

    try {
      const containers = await this.docker.listContainers({
        all: true,
        filters: { name: [containerName] },
      });

      if (containers.length === 0) {
        return false;
      }

      const containerInfo: ContainerInfo = containers[0] as ContainerInfo;
      return containerInfo.State === "running";
    } catch (error) {
      this.logger.error(
        `Error checking container status for ${containerName}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ApiInternalServerException(
        `Failed to check container status for ${containerName}`,
        { originalError: error },
      );
    }
  }

  async execCommand(
    flowId: FlowId,
    containerName: string,
    command: string,
    tracing: ApiTracingInput,
  ): Promise<string> {
    if (!this.docker) {
      throw new Error("Docker client not initialized");
    }

    const isRunning = await this.isContainerRunning(containerName);
    if (!isRunning) {
      throw new Error(`Container ${containerName} is not running`);
    }

    // Log input command
    await this.logCreateUsecase.execute(
      { flowId: Number(flowId), message: command, type: LogType.INPUT },
      tracing,
    );
    this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
      flowId: Number(flowId),
      content: `$ ${command}`,
      isInput: true,
    });

    const containers = await this.docker.listContainers({
      all: true,
      filters: { name: [containerName] },
    });

    const containerInfo = containers[0];
    if (!containerInfo || !containerInfo.Id) {
      throw new Error(`Container ${containerName} not found`);
    }

    const container = this.docker.getContainer(containerInfo.Id);

    // Create exec instance
    const exec = await container.exec({
      Cmd: ["sh", "-c", command],
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    // Attach to exec stream
    const stream = await exec.start({ hijack: true, stdin: false });

    // Collect output
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Wait for stream to end
    await new Promise<void>((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    // Inspect exec to ensure it completed
    const execInspect = await exec.inspect();
    if (execInspect.ExitCode !== 0 && execInspect.ExitCode !== null) {
      const output = Buffer.concat(chunks as unknown as Uint8Array[]).toString();
      throw new Error(
        `Command failed with exit code ${execInspect.ExitCode}: ${output}`,
      );
    }

    const result = Buffer.concat(chunks as unknown as Uint8Array[]).toString();

    // Log output
    await this.logCreateUsecase.execute(
      { flowId: Number(flowId), message: result, type: LogType.OUTPUT },
      tracing,
    );
    this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
      flowId: Number(flowId),
      content: result,
      isInput: false,
    });

    return result || "Command executed successfully";
  }

  async writeFile(
    flowId: FlowId,
    containerName: string,
    content: string,
    path: string,
    tracing: ApiTracingInput,
  ): Promise<void> {
    if (!this.docker) {
      throw new Error("Docker client not initialized");
    }

    const isRunning = await this.isContainerRunning(containerName);
    if (!isRunning) {
      throw new Error(`Container ${containerName} is not running`);
    }

    // Log input content
    await this.logCreateUsecase.execute(
      {
        flowId: Number(flowId),
        message: `Writing to ${path}:\n${content}`,
        type: LogType.INPUT,
      },
      tracing,
    );
    this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
      flowId: Number(flowId),
      content: `Writing to ${path}:\n${content}`,
      isInput: true,
    });

    const containers = await this.docker.listContainers({
      all: true,
      filters: { name: [containerName] },
    });

    const containerInfo = containers[0];
    if (!containerInfo || !containerInfo.Id) {
      throw new Error(`Container ${containerName} not found`);
    }

    const container = this.docker.getContainer(containerInfo.Id);

    // Create tar archive
    const pack = tar.pack();
    const filename = path.split("/").pop() || path;
    const dir = path.substring(0, path.lastIndexOf("/")) || "/";

    pack.entry(
      {
        name: filename,
        mode: 0o600,
        size: Buffer.byteLength(content),
      },
      content,
    );

    pack.finalize();

    // Copy to container
    await container.putArchive(pack, { path: dir });

    const message = `Wrote to ${path}`;
    await this.logCreateUsecase.execute(
      { flowId: Number(flowId), message, type: LogType.OUTPUT },
      tracing,
    );
    this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
      flowId: Number(flowId),
      content: message,
      isInput: false,
    });
  }

  async readFile(
    flowId: FlowId,
    containerName: string,
    path: string,
    tracing: ApiTracingInput,
  ): Promise<string> {
    if (!this.docker) {
      throw new Error("Docker client not initialized");
    }

    const isRunning = await this.isContainerRunning(containerName);
    if (!isRunning) {
      throw new Error(`Container ${containerName} is not running`);
    }

    // Log input command
    await this.logCreateUsecase.execute(
      { flowId: Number(flowId), message: `Reading file: ${path}`, type: LogType.INPUT },
      tracing,
    );
    this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
      flowId: Number(flowId),
      content: `Reading file: ${path}`,
      isInput: true,
    });

    const containers = await this.docker.listContainers({
      all: true,
      filters: { name: [containerName] },
    });

    const containerInfo = containers[0];
    if (!containerInfo || !containerInfo.Id) {
      throw new Error(`Container ${containerName} not found`);
    }

    const container = this.docker.getContainer(containerInfo.Id);

    // Create exec instance to read file
    const exec = await container.exec({
      Cmd: ["cat", path],
      AttachStdout: true,
      AttachStderr: true,
    });

    // Attach to exec stream
    const stream = await exec.start({ hijack: true, stdin: false });

    // Collect output
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    // Wait for stream to end
    await new Promise<void>((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    const result = Buffer.concat(chunks as unknown as Uint8Array[]).toString();

    // Log output
    await this.logCreateUsecase.execute(
      { flowId: Number(flowId), message: result, type: LogType.OUTPUT },
      tracing,
    );
    this.eventService.emit(EventNameEnum.TERMINAL_OUTPUT, {
      flowId: Number(flowId),
      content: result,
      isInput: false,
    });

    return result;
  }
}
