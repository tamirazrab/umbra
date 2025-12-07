import { ILoggerAdapter } from "@/infra/logger";
import { IContainerUpdateAdapter } from "@/modules/container/adapter";
import {
  getUUID,
  mockRejectedValue,
  mockResolvedValue,
  mockTracing,
} from "@/test/mock";
import {
  ApiInternalServerException,
  ApiNotFoundException,
} from "@/utils/exception";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ContainerEntity, ContainerStatus } from "../../entity/container";
import { IContainerRepository } from "../../repository/container";
import {
  type ContainerUpdateInput,
  ContainerUpdateUsecase,
} from "../container-update";

describe(ContainerUpdateUsecase.name, () => {
  let usecase: IContainerUpdateAdapter;
  let repository: IContainerRepository;
  let logger: ILoggerAdapter;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IContainerRepository,
          useValue: {},
        },
        {
          provide: ILoggerAdapter,
          useValue: {
            info: vi.fn(),
          },
        },
        {
          provide: IContainerUpdateAdapter,
          useFactory: (
            containerRepository: IContainerRepository,
            loggerService: ILoggerAdapter,
          ) => {
            return new ContainerUpdateUsecase(
              containerRepository,
              loggerService,
            );
          },
          inject: [IContainerRepository, ILoggerAdapter],
        },
      ],
    }).compile();

    usecase = app.get(IContainerUpdateAdapter);
    repository = app.get(IContainerRepository);
    logger = app.get(ILoggerAdapter);
  });

  const existingContainer = new ContainerEntity({
    id: getUUID(),
    name: "old-name",
    localId: "docker-123",
    image: "ubuntu:20.04",
    status: ContainerStatus.RUNNING,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const input: ContainerUpdateInput = {
    id: getUUID(),
    name: "new-name",
    image: "ubuntu:22.04",
  };

  const updatedContainer = new ContainerEntity({
    ...existingContainer,
    name: "new-name",
    image: "ubuntu:22.04",
    updatedAt: new Date(),
  });

  test("when container updated successfully, should return updated container", async () => {
    repository.findOne = mockResolvedValue(existingContainer);
    repository.updateOne = mockResolvedValue(updatedContainer);

    const result = await usecase.execute(input, mockTracing());

    expect(result).toEqual(updatedContainer);
    expect(logger.info).toHaveBeenCalledWith({
      message: "container updated successfully",
      obj: { container: updatedContainer },
    });
  });

  test("when container not found, should throw NotFoundException", async () => {
    repository.findOne = mockResolvedValue(null);

    await expect(usecase.execute(input, mockTracing())).rejects.toThrow(
      ApiNotFoundException,
    );
  });

  test("when partial update is provided, should update only specified fields", async () => {
    const partialInput: ContainerUpdateInput = {
      id: getUUID(),
      name: "new-name",
    };

    const partiallyUpdatedContainer = new ContainerEntity({
      ...existingContainer,
      name: "new-name",
      updatedAt: new Date(),
    });

    repository.findOne = mockResolvedValue(existingContainer);
    repository.updateOne = mockResolvedValue(partiallyUpdatedContainer);

    await expect(usecase.execute(partialInput, mockTracing())).resolves.toEqual(
      partiallyUpdatedContainer,
    );
  });

  test("when transaction throw an error, should expect an error", async () => {
    repository.findOne = mockResolvedValue(existingContainer);
    repository.updateOne = mockRejectedValue(new ApiInternalServerException());

    await expect(usecase.execute(input, mockTracing())).rejects.toThrow(
      ApiInternalServerException,
    );
  });
});
