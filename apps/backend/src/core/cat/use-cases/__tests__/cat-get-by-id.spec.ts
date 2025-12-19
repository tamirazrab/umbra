import { ILoggerAdapter, LoggerModule } from "@/infra/logger";
import { ICatGetByIdAdapter } from "@/modules/cat/adapter";

import { ApiNotFoundException } from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";
import { Test } from "@nestjs/testing";
import { expectZodError, getUUID, mockResolvedValue, nameOf } from "test/mock";
import { beforeEach, describe, expect, test } from "vitest";
import { CatEntity } from "../../entity/cat";
import { ICatRepository } from "../../repository/cat";
import { type CatGetByIdInput, CatGetByIdUsecase } from "../cat-get-by-id";

describe(CatGetByIdUsecase.name, () => {
  let usecase: ICatGetByIdAdapter;
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
          provide: ICatGetByIdAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatGetByIdUsecase(catRepository);
          },
          inject: [ICatRepository, ILoggerAdapter],
        },
      ],
    }).compile();

    usecase = app.get(ICatGetByIdAdapter);
    repository = app.get(ICatRepository);
  });

  test("when no input is specified, should expect an error", async () => {
    await expectZodError(
      () => usecase.execute({} as CatGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: "Required", path: nameOf<CatGetByIdInput>("id") },
        ]);
      },
    );
  });

  test("when cat not found, should expect an error", async () => {
    repository.findById = mockResolvedValue<CatEntity>(null);

    await expect(usecase.execute({ id: getUUID() })).rejects.toThrow(
      ApiNotFoundException,
    );
  });

  const cat = new CatEntity({
    id: getUUID(),
    name: "Miau",
    breed: "dummy",
    age: 10,
  });

  test("when cat found, should expect a cat found", async () => {
    repository.findById = mockResolvedValue<CatEntity>(cat);

    await expect(usecase.execute({ id: getUUID() })).resolves.toEqual(cat);
  });
});
