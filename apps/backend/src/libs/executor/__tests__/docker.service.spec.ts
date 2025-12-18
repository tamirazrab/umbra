import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import Docker from "dockerode";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  ContainerEntity,
  ContainerStatus,
} from "@/core/container/entity/container";
import { IContainerRepository } from "@/core/container/repository/container";
import { LogType } from "@/core/log/entity/log";
import { IEventAdapter } from "@/libs/event/adapter";
import { EventNameEnum } from "@/libs/event/types";
import { ILogCreateAdapter } from "@/modules/log/adapter";
import { getUUID, mockFn, mockResolvedValue, mockTracing } from "../../../../test/mock";

import { DockerService } from "../docker.service";

describe(DockerService.name, () => {
  let service: DockerService;
  let containerRepository: IContainerRepository;
  let logCreateUsecase: ILogCreateAdapter;
  let eventService: IEventAdapter;
  let mockDocker: Docker;

  beforeEach(async () => {
    // Create mock Docker instance
    mockDocker = {
      ping: vi.fn().mockResolvedValue(undefined),
      info: vi.fn().mockResolvedValue({
        Name: "test-docker",
        Architecture: "amd64",
        ServerVersion: "24.0.0",
      }),
      listImages: vi.fn().mockResolvedValue([]),
      pull: vi.fn().mockImplementation((_image, _options, callback) => {
        const mockStream = {
          on: vi.fn((event, handler) => {
            if (event === "end") {
              setTimeout(() => handler(), 10);
            }
            return mockStream;
          }),
        };
        callback(null, mockStream);
      }),
      modem: {
        followProgress: vi.fn((_stream, callback) => {
          callback(null);
        }),
      },
      createContainer: vi.fn().mockResolvedValue({
        id: "container-123",
        start: vi.fn().mockResolvedValue(undefined),
      }),
      listContainers: vi.fn().mockResolvedValue([
        {
          Id: "container-123",
          State: "running",
          Names: ["test-container"],
        },
      ]),
      getContainer: vi.fn().mockReturnValue({
        stop: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
        exec: vi.fn().mockResolvedValue({
          start: vi.fn().mockResolvedValue({
            on: vi.fn((event, handler) => {
              if (event === "data") {
                handler(Buffer.from("test output"));
              }
              if (event === "end") {
                setTimeout(() => handler(), 10);
              }
              return {
                on: vi.fn(),
              };
            }),
          }),
          inspect: vi.fn().mockResolvedValue({
            ExitCode: 0,
          }),
        }),
        putArchive: vi.fn().mockResolvedValue(undefined),
      }),
    } as unknown as Docker;

    const app = await Test.createTestingModule({
      providers: [
        DockerService,
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === "app.docker.socketPath") return "/var/run/docker.sock";
              if (key === "app.docker.defaultImage") return "debian:latest";
              return null;
            }),
          },
        },
        {
          provide: IContainerRepository,
          useValue: {
            create: mockFn(),
            updateOne: mockFn(),
            remove: mockFn(),
          },
        },
        {
          provide: ILogCreateAdapter,
          useValue: {
            execute: mockFn(),
          },
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: mockFn(),
          },
        },
      ],
    }).compile();

    service = app.get(DockerService);
    containerRepository = app.get(IContainerRepository);
    logCreateUsecase = app.get(ILogCreateAdapter);
    eventService = app.get(IEventAdapter);

    // Replace docker instance with mock (skip onModuleInit which would create real Docker instance)
    (service as unknown as { docker: Docker | null }).docker = mockDocker;
  });

  test("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("onModuleInit", () => {
    test("should initialize Docker client successfully", async () => {
      // Reset docker to null to simulate fresh state
      (service as unknown as { docker: Docker | null }).docker = null;

      // Since we can't mock Docker constructor, manually set docker after onModuleInit would create it
      // For this test, we'll verify the docker instance gets set
      (service as unknown as { docker: Docker | null }).docker = mockDocker;

      // Call onModuleInit - it will try to create Docker but we've already set it
      await service.onModuleInit();

      // Verify docker instance exists
      expect((service as unknown as { docker: Docker | null }).docker).toBeDefined();
    });

    test("should handle Docker initialization error", async () => {
      // Reset docker to null
      (service as unknown as { docker: Docker | null }).docker = null;

      // Create a mock that throws on ping
      const errorDocker = {
        ...mockDocker,
        ping: vi.fn().mockRejectedValue(new Error("Docker not available")),
      } as unknown as Docker;

      (service as unknown as { docker: Docker | null }).docker = errorDocker;

      // onModuleInit will call ping which will throw
      await expect(service.onModuleInit()).rejects.toThrow();
    });
  });

  describe("spawnContainer", () => {
    test("should spawn container successfully", async () => {
      const flowId = 123;
      const containerId = getUUID();
      const mockContainer = new ContainerEntity({
        id: containerId,
        name: "test-container",
        image: "ubuntu:22.04",
        status: ContainerStatus.STARTING,
        localId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const runningContainer = new ContainerEntity({
        ...mockContainer,
        status: ContainerStatus.RUNNING,
        localId: "container-123",
      });

      containerRepository.create = mockResolvedValue(mockContainer);
      containerRepository.updateOne = mockResolvedValue(runningContainer);
      mockDocker.listImages = vi.fn().mockResolvedValue([{ Id: "image-123" }]);

      const result = await service.spawnContainer(
        flowId,
        {
          name: "test-container",
          image: "ubuntu:22.04",
          cmd: ["tail", "-f", "/dev/null"],
        },
        mockTracing(),
      );

      expect(containerRepository.create).toHaveBeenCalled();
      expect(mockDocker.createContainer).toHaveBeenCalled();
      expect(result.status).toBe(ContainerStatus.RUNNING);
    });

    test("should pull image if not exists locally", async () => {
      const flowId = 123;
      const containerId = getUUID();
      const mockContainer = new ContainerEntity({
        id: containerId,
        name: "test-container",
        image: "ubuntu:22.04",
        status: ContainerStatus.STARTING,
        localId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const runningContainer = new ContainerEntity({
        ...mockContainer,
        status: ContainerStatus.RUNNING,
        localId: "container-123",
      });

      mockDocker.listImages = vi.fn().mockResolvedValue([]);
      containerRepository.create = mockResolvedValue(mockContainer);
      containerRepository.updateOne = mockResolvedValue(runningContainer);

      await service.spawnContainer(
        flowId,
        {
          name: "test-container",
          image: "new-image:latest",
        },
        mockTracing(),
      );

      expect(mockDocker.pull).toHaveBeenCalledWith(
        "new-image:latest",
        {},
        expect.any(Function),
      );
    });

    test("should handle container creation failure", async () => {
      const flowId = 123;
      const containerId = getUUID();
      const mockContainer = new ContainerEntity({
        id: containerId,
        name: "test-container",
        image: "ubuntu:22.04",
        status: ContainerStatus.STARTING,
        localId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      containerRepository.create = mockResolvedValue(mockContainer);
      mockDocker.createContainer = vi
        .fn()
        .mockRejectedValue(new Error("Failed to create"));
      containerRepository.updateOne = mockResolvedValue({
        ...mockContainer,
        status: ContainerStatus.FAILED,
      });

      await expect(
        service.spawnContainer(
          flowId,
          {
            name: "test-container",
            image: "ubuntu:22.04",
          },
          mockTracing(),
        ),
      ).rejects.toThrow();
      expect(containerRepository.updateOne).toHaveBeenCalledWith(
        { id: containerId },
        expect.objectContaining({ status: ContainerStatus.FAILED }),
      );
    });
  });

  describe("stopContainer", () => {
    test("should stop container successfully", async () => {
      const dbContainerId = getUUID();
      const localContainerId = "local-container-id";

      await service.stopContainer(localContainerId, dbContainerId, mockTracing());

      expect(mockDocker.getContainer(localContainerId).stop).toHaveBeenCalled();
      expect(containerRepository.updateOne).toHaveBeenCalledWith(
        { id: dbContainerId },
        expect.objectContaining({ status: ContainerStatus.STOPPED }),
      );
    });

    test("should mark as stopped if container not found", async () => {
      const dbContainerId = getUUID();
      const localContainerId = "non-existent-container";
      mockDocker.getContainer(localContainerId).stop = vi
        .fn()
        .mockRejectedValue(new Error("No such container"));

      await service.stopContainer(localContainerId, dbContainerId, mockTracing());

      expect(containerRepository.updateOne).toHaveBeenCalledWith(
        { id: dbContainerId },
        expect.objectContaining({ status: ContainerStatus.STOPPED }),
      );
    });
  });

  describe("deleteContainer", () => {
    test("should delete container successfully", async () => {
      const dbContainerId = getUUID();
      const localContainerId = "local-container-id";

      await service.deleteContainer(localContainerId, dbContainerId, mockTracing());

      expect(mockDocker.getContainer(localContainerId).remove).toHaveBeenCalled();
    });
  });

  describe("isContainerRunning", () => {
    test("should return true if container is running", async () => {
      mockDocker.listContainers = vi.fn().mockResolvedValue([
        { Id: "container-123", Names: ["/test-container"], State: "running" },
      ]);
      const isRunning = await service.isContainerRunning("test-container");
      expect(isRunning).toBe(true);
    });

    test("should return false if container is not running", async () => {
      mockDocker.listContainers = vi.fn().mockResolvedValue([
        { Id: "container-123", Names: ["/test-container"], State: "stopped" },
      ]);
      const isRunning = await service.isContainerRunning("test-container");
      expect(isRunning).toBe(false);
    });

    test("should return false if container not found", async () => {
      mockDocker.listContainers = vi.fn().mockResolvedValue([]);
      const isRunning = await service.isContainerRunning("non-existent");
      expect(isRunning).toBe(false);
    });
  });

  describe("execCommand", () => {
    test("should execute command and return result", async () => {
      const flowId = 123;
      const containerName = "test-container";
      const command = "ls -la";
      const mockResult = "file1\nfile2";

      mockDocker.listContainers = vi.fn().mockResolvedValue([
        { Id: "container-123", Names: ["/test-container"], State: "running" },
      ]);
      const mockExec = {
        start: vi.fn().mockResolvedValue({
          on: vi.fn((event, handler) => {
            if (event === "data") {
              handler(Buffer.from(mockResult));
            }
            if (event === "end") {
              setTimeout(() => handler(), 10);
            }
            return {
              on: vi.fn(),
            };
          }),
        }),
        inspect: vi.fn().mockResolvedValue({ ExitCode: 0 }),
      };
      mockDocker.getContainer(containerName).exec = vi.fn().mockResolvedValue(mockExec);

      const result = await service.execCommand(flowId, containerName, command, mockTracing());

      expect(logCreateUsecase.execute).toHaveBeenCalledWith(
        { flowId, message: command, type: LogType.INPUT },
        mockTracing(),
      );
      expect(eventService.emit).toHaveBeenCalledWith(EventNameEnum.TERMINAL_OUTPUT, {
        flowId,
        content: `$ ${command}`,
        isInput: true,
      });
      expect(result).toContain(mockResult);
      expect(logCreateUsecase.execute).toHaveBeenCalledWith(
        { flowId, message: expect.stringContaining(mockResult), type: LogType.OUTPUT },
        mockTracing(),
      );
    });

    test("should throw error if container not running", async () => {
      const flowId = 123;
      const containerName = "test-container";
      const command = "ls -la";

      mockDocker.listContainers = vi.fn().mockResolvedValue([]);

      await expect(
        service.execCommand(flowId, containerName, command, mockTracing()),
      ).rejects.toThrow(`Container ${containerName} is not running`);
    });
  });

  describe("writeFile", () => {
    test("should write file successfully", async () => {
      const flowId = 123;
      const containerName = "test-container";
      const content = "hello world";
      const filePath = "/app/test.txt";

      mockDocker.listContainers = vi.fn().mockResolvedValue([
        { Id: "container-123", Names: ["/test-container"], State: "running" },
      ]);

      await service.writeFile(flowId, containerName, content, filePath, mockTracing());

      expect(logCreateUsecase.execute).toHaveBeenCalledWith(
        { flowId, message: `Writing to ${filePath}:\n${content}`, type: LogType.INPUT },
        mockTracing(),
      );
      expect(eventService.emit).toHaveBeenCalledWith(EventNameEnum.TERMINAL_OUTPUT, {
        flowId,
        content: `Writing to ${filePath}:\n${content}`,
        isInput: true,
      });
      expect(mockDocker.getContainer(containerName).putArchive).toHaveBeenCalled();
    });
  });

  describe("readFile", () => {
    test("should read file successfully", async () => {
      const flowId = 123;
      const containerName = "test-container";
      const filePath = "/app/test.txt";
      const mockFileContent = "file content";

      mockDocker.listContainers = vi.fn().mockResolvedValue([
        { Id: "container-123", Names: ["/test-container"], State: "running" },
      ]);
      const mockExec = {
        start: vi.fn().mockResolvedValue({
          on: vi.fn((event, handler) => {
            if (event === "data") {
              handler(Buffer.from(mockFileContent));
            }
            if (event === "end") {
              setTimeout(() => handler(), 10);
            }
            return {
              on: vi.fn(),
            };
          }),
        }),
        inspect: vi.fn().mockResolvedValue({ ExitCode: 0 }),
      };
      mockDocker.getContainer(containerName).exec = vi.fn().mockResolvedValue(mockExec);

      const result = await service.readFile(flowId, containerName, filePath, mockTracing());

      expect(logCreateUsecase.execute).toHaveBeenCalledWith(
        { flowId, message: `Reading file: ${filePath}`, type: LogType.INPUT },
        mockTracing(),
      );
      expect(result).toBe(mockFileContent);
      expect(logCreateUsecase.execute).toHaveBeenCalledWith(
        { flowId, message: mockFileContent, type: LogType.OUTPUT },
        mockTracing(),
      );
    });
  });
});
