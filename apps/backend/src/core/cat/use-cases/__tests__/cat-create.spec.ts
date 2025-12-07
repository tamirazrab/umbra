import { Test } from "@nestjs/testing";

import { CreatedModel } from "@/infra/repository";
import { ICatCreateAdapter } from "@/modules/cat/adapter";
import { ApiInternalServerException } from "@/utils/exception";
import { ZodExceptionIssue } from "@/utils/validator";

import { CatEntity } from "../../entity/cat";
import { ICatRepository } from "../../repository/cat";
import { CatCreateInput, CatCreateUsecase } from "../cat-create";
import {
  expectZodError,
  mockTracing,
  getUUID,
  mockResolvedValue,
  mockRejectedValue,
} from "@/test/mock";
import { describe, beforeEach, test, expect } from "vitest";

describe(CatCreateUsecase.name, () => {
  let usecase: ICatCreateAdapter;
  let repository: ICatRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: ICatRepository,
          useValue: {},
        },
        {
          provide: ICatCreateAdapter,
          useFactory: (catRepository: ICatRepository) => {
            return new CatCreateUsecase(catRepository);
          },
          inject: [ICatRepository],
        },
      ],
    }).compile();

    usecase = app.get(ICatCreateAdapter);
    repository = app.get(ICatRepository);
  });

  test("when no input is specified, should expect an error", async () => {
    await expectZodError(
      () => usecase.execute({} as CatCreateInput, mockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          {
            message: "Required",
            path: nameOf<CatCreateInput>("name"),
          },
          {
            message: "Required",
            path: nameOf<CatCreateInput>("breed"),
          },
          { message: "Required", path: nameOf<CatCreateInput>("age") },
        ]);
      },
    );
  });

  const input = new CatEntity({
    id: getUUID(),
    age: 10,
    breed: "dummy",
    name: "dummy",
  });

  test("when cat created successfully, should expect a cat created", async () => {
    repository.create = mockResolvedValue<CreatedModel>(input);

    await expect(usecase.execute(input, mockTracing())).resolves.toEqual(
      input,
    );
  });

  test("when transaction throw an error, should expect an error", async () => {
    repository.create = mockRejectedValue(new ApiInternalServerException());

    await expect(usecase.execute(input, mockTracing())).rejects.toThrow(
      ApiInternalServerException,
    );
  });
});
