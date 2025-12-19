import { RoleEntity, RoleEnum } from "@/core/role/entity/role";
import { ITokenAdapter, TokenLibModule } from "@/libs/token";
import { ILoginAdapter } from "@/modules/login/adapter";
import {
  ApiBadRequestException,
  ApiNotFoundException,
} from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { UserEntity } from "../../entity/user";
import { IUserRepository } from "../../repository/user";
import { type LoginInput, type LoginOutput, LoginUsecase } from "../user-login";
import { expectZodError, mockTracing, nameOf, mockResolvedValue, getUUID } from "test/mock";

describe(LoginUsecase.name, () => {
  let usecase: ILoginAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [TokenLibModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {},
        },
        {
          provide: ILoginAdapter,
          useFactory: (
            userRepository: IUserRepository,
            token: ITokenAdapter,
          ) => {
            return new LoginUsecase(userRepository, token);
          },
          inject: [IUserRepository, ITokenAdapter],
        },
      ],
    }).compile();

    usecase = app.get(ILoginAdapter);
    repository = app.get(IUserRepository);
  });

  test("when no input is specified, should expect an error", async () => {
    await expectZodError(
      () => usecase.execute({} as LoginInput, mockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: "Required", path: nameOf<LoginInput>("email") },
          {
            message: "Required",
            path: nameOf<LoginInput>("password"),
          },
        ]);
      },
    );
  });

  const input: LoginInput = { email: "admin@admin.com", password: "****" };
  test("when user not found, should expect an error", async () => {
    repository.findOneWithRelation =
      mockResolvedValue<UserEntity>(null);

    await expect(
      usecase.execute(input, mockTracing()),
    ).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: getUUID(),
    email: "admin@admin.com",
    name: "Admin",
    roles: [
      new RoleEntity({ id: getUUID(), name: RoleEnum.USER }),
    ],
    password: { id: getUUID(), password: "***" },
  });

  test("when user role not found, should expect an error", async () => {
    repository.findOneWithRelation = mockResolvedValue<UserEntity>({
      ...user,
      roles: [],
    });

    await expect(
      usecase.execute(input, mockTracing()),
    ).rejects.toThrow(ApiNotFoundException);
  });

  test("when password is incorrect, should expect an error", async () => {
    repository.findOneWithRelation =
      mockResolvedValue<UserEntity>(user);

    await expect(
      usecase.execute(input, mockTracing()),
    ).rejects.toThrow(ApiBadRequestException);
  });

  test("when user login successfully, should expect a token", async () => {
    user.password.password =
      "69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820";
    repository.findOneWithRelation =
      mockResolvedValue<UserEntity>(user);

    await expect(
      usecase.execute(input, mockTracing()),
    ).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
    } as LoginOutput);
  });
});
