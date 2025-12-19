import { RoleEntity, RoleEnum } from "@/core/role/entity/role";
import { LoggerModule } from "@/infra/logger";
import type { CreatedModel } from "@/infra/repository";
import { IUserChangePasswordAdapter } from "@/modules/user/adapter";

import {
  ApiBadRequestException,
  ApiNotFoundException,
} from "@/utils/exception";
import type { ZodExceptionIssue } from "@/utils/validator";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";
import { UserEntity } from "../../entity/user";
import { UserPasswordEntity } from "../../entity/user-password";
import { IUserRepository } from "../../repository/user";
import {
  type UserChangePasswordInput,
  UserChangePasswordUsecase,
} from "../user-change-password";
import { expectZodError, nameOf, getUUID, mockResolvedValue } from "test/mock";

describe(UserChangePasswordUsecase.name, () => {
  let usecase: IUserChangePasswordAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {},
        },
        {
          provide: IUserChangePasswordAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserChangePasswordUsecase(userRepository);
          },
          inject: [IUserRepository],
        },
      ],
    }).compile();

    usecase = app.get(IUserChangePasswordAdapter);
    repository = app.get(IUserRepository);
  });

  test("when no input is specified, should expect an error", async () => {
    await expectZodError(
      () => usecase.execute({} as UserChangePasswordInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: "Required", path: nameOf<UserChangePasswordInput>("id") },
          {
            message: "Required",
            path: nameOf<UserChangePasswordInput>("password"),
          },
          {
            message: "Required",
            path: nameOf<UserChangePasswordInput>("newPassword"),
          },
          {
            message: "Required",
            path: nameOf<UserChangePasswordInput>("confirmPassword"),
          },
        ]);
      },
    );
  });

  const input: UserChangePasswordInput = {
    id: getUUID(),
    password: "****",
    confirmPassword: "****",
    newPassword: "****",
  };

  test("when user not found, should expect an error", async () => {
    repository.findOneWithRelation = mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: getUUID(),
    email: "admin@admin.com",
    name: "Admin",
    password: new UserPasswordEntity({
      id: getUUID(),
      password:
        "69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820",
    }),
    roles: [new RoleEntity({ id: getUUID(), name: RoleEnum.USER })],
  });

  test("when user password is incorrect, should expect an error", async () => {
    repository.findOneWithRelation = mockResolvedValue<UserEntity>(user);

    await expect(
      usecase.execute({ ...input, password: "wrongPassword" }),
    ).rejects.toThrow(ApiBadRequestException);
  });

  test("when user password are not equal, should expect an error", async () => {
    repository.findOneWithRelation = mockResolvedValue<UserEntity>(user);

    await expect(
      usecase.execute({ ...input, confirmPassword: "wrongPassword" }),
    ).rejects.toThrow(ApiBadRequestException);
  });

  test("when change password successfully, should change password", async () => {
    repository.findOneWithRelation = mockResolvedValue<UserEntity>(user);
    repository.create = mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });
});
