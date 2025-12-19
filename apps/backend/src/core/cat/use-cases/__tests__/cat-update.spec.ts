import { ILoggerAdapter, LoggerModule } from "@/infra/logger";
import type { UpdatedModel } from "@/infra/repository";
import { ICatUpdateAdapter } from "@/modules/cat/adapter";
import { ApiNotFoundException } from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";
import { CatEntity } from "../../entity/cat";
import { ICatRepository } from "../../repository/cat";
import { type CatUpdateInput, CatUpdateUsecase } from "../cat-update";
import { expectZodError, mockTracing, nameOf, mockResolvedValue, getUUID } from "test/mock";

describe(CatUpdateUsecase.name, () => {
  let usecase: ICatUpdateAdapter;
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
          provide: ICatUpdateAdapter,
          useFactory: (
            catRepository: ICatRepository,
            logger: ILoggerAdapter,
          ) => {
            return new CatUpdateUsecase(catRepository, logger);
          },
          inject: [ICatRepository, ILoggerAdapter],
        },
      ],
    }).compile();

    usecase = app.get(ICatUpdateAdapter);
    repository = app.get(ICatRepository);
  });

  test("when no input is specified, should expect an error", async () => {
    await expectZodError(
      () => usecase.execute({} as CatUpdateInput, mockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: "Required", path: nameOf<CatUpdateInput>("id") },
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

  test("when cat updated successfully, should expect a cat updated", async () => {
    repository.findById = mockResolvedValue<CatEntity>(cat);
    repository.updateOne = mockResolvedValue<UpdatedModel>();

    await expect(
      usecase.execute({ id: getUUID() }, mockTracing()),
    ).resolves.toEqual(cat);
  });
});
