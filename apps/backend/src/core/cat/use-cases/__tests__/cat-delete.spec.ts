import { Test } from "@nestjs/testing";
import { expectZodError, getUUID, mockResolvedValue, mockTracing, nameOf} from "test/mock";

import {
  CatDeleteInput,
  CatDeleteUsecase,
} from "@/core/cat/use-cases/cat-delete";
import { ILoggerAdapter, LoggerModule } from "@/infra/logger";
import { UpdatedModel } from "@/infra/repository";
import { ICatDeleteAdapter } from "@/modules/cat/adapter";
import { ApiNotFoundException } from "@/utils/exception";
import { ZodExceptionIssue } from "@/utils/validator";

import { CatEntity } from "../../entity/cat";
import { ICatRepository } from "../../repository/cat";
import { describe, beforeEach, test, expect } from "vitest";

describe(CatDeleteUsecase.name, () => {
  let usecase: ICatDeleteAdapter;
  let repository: ICatRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: ICatRepository,
          useValue: {},
        },
        {
          provide: ICatDeleteAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatDeleteUsecase(catRepository);
          },
          inject: [ICatRepository, ILoggerAdapter],
        },
      ],
    }).compile();

    usecase = app.get(ICatDeleteAdapter);
    repository = app.get(ICatRepository);
  });

  test("when no input is specified, should expect an error", async () => {
    await expectZodError(
      () => usecase.execute({} as CatDeleteInput, mockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: "Required", path: nameOf<CatDeleteInput>("id") },
        ]);
      },
    );
  });

  test("when cat not found, should expect an error", async () => {
    repository.findById = mockResolvedValue<CatEntity>(null);

    await expect(
      usecase.execute({ id: getUUID() }, mockTracing()),
    ).rejects.toThrow(ApiNotFoundException);
  });

  const cat = new CatEntity({
    id: getUUID(),
    age: 10,
    breed: "dummy",
    name: "dummy",
  });

  test("when cat deleted successfully, should expect a cat deleted", async () => {
    repository.findById = mockResolvedValue<CatEntity>(cat);
    repository.updateOne = mockResolvedValue<UpdatedModel>();

    await expect(
      usecase.execute({ id: getUUID() }, mockTracing()),
    ).resolves.toEqual({
      ...cat,
      deletedAt: expect.any(Date),
    });
  });
});
