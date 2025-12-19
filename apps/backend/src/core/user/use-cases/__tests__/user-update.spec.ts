import { RoleEntity, RoleEnum } from "@/core/role/entity/role";
import { IRoleRepository } from "@/core/role/repository/role";
import { ILoggerAdapter, LoggerModule } from "@/infra/logger";
import type { CreatedModel } from "@/infra/repository";
import { IUserUpdateAdapter } from "@/modules/user/adapter";

import { ApiConflictException, ApiNotFoundException } from "@/utils/exception";
import { UUIDUtils } from "@/utils/uuid";
import type { ZodExceptionIssue } from "@/utils/validator";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";
import { UserEntity } from "../../entity/user";
import { IUserRepository } from "../../repository/user";
import { type UserUpdateInput, UserUpdateUsecase } from "../user-update";
import { expectZodError, mockTracing, nameOf, getUUID, mockResolvedValue } from "test/mock";

describe(UserUpdateUsecase.name, () => {
  let usecase: IUserUpdateAdapter;
  let repository: IUserRepository;
  let roleRepository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        {
          provide: IUserRepository,
          useValue: {},
        },
        {
          provide: IRoleRepository,
          useValue: {},
        },
        {
          provide: IUserUpdateAdapter,
          useFactory: (
            userRepository: IUserRepository,
            logger: ILoggerAdapter,
            roleRepository: IRoleRepository,
          ) => {
            return new UserUpdateUsecase(
              userRepository,
              logger,
              roleRepository,
            );
          },
          inject: [IUserRepository, ILoggerAdapter, IRoleRepository],
        },
      ],
    }).compile();

    usecase = app.get(IUserUpdateAdapter);
    repository = app.get(IUserRepository);
    roleRepository = app.get(IRoleRepository);
  });

  test("when no input is specified, should expect an error", async () => {
    await expectZodError(
      () => usecase.execute({} as UserUpdateInput, mockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: "Required", path: nameOf<UserUpdateInput>("id") },
        ]);
      },
    );
  });

  const user = new UserEntity({
    id: getUUID(),
    name: "Admin",
    email: "admin@admin.com",
    roles: [new RoleEntity({ id: getUUID(), name: RoleEnum.USER })],
  });

  const input: UserUpdateInput = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: [RoleEnum.USER],
  };

  test("when user not found, should expect an error", async () => {
    repository.findOne = mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input, mockTracing())).rejects.toThrow(
      ApiNotFoundException,
    );
  });

  const role = new RoleEntity({ id: UUIDUtils.create(), name: RoleEnum.USER });

  test("when user already exists, should expect an error", async () => {
    repository.findOne = mockResolvedValue<UserEntity>(user);
    repository.existsOnUpdate = mockResolvedValue<boolean>(true);
    roleRepository.findIn = mockResolvedValue<RoleEntity[]>([role]);

    await expect(usecase.execute(input, mockTracing())).rejects.toThrow(
      ApiConflictException,
    );
  });

  test("when nole not found, should expect an error", async () => {
    repository.findOne = mockResolvedValue<UserEntity>(user);
    roleRepository.findIn = mockResolvedValue<RoleEntity[]>([]);

    await expect(usecase.execute(input, mockTracing())).rejects.toThrow(
      ApiNotFoundException,
    );
  });

  test("when user updated successfully, should expect an user updated", async () => {
    repository.findOne = mockResolvedValue<UserEntity>(user);
    repository.existsOnUpdate = mockResolvedValue<boolean>(false);
    roleRepository.findIn = mockResolvedValue<RoleEntity[]>([role]);
    repository.create = mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input, mockTracing())).resolves.toEqual(user);
  });

  test("when user role not provided, should use user role, then should expect an user updated", async () => {
    repository.findOne = mockResolvedValue<UserEntity>(user);
    repository.existsOnUpdate = mockResolvedValue<boolean>(false);
    roleRepository.findIn = mockResolvedValue<RoleEntity[]>([role]);
    repository.create = mockResolvedValue<CreatedModel>();

    await expect(
      usecase.execute({ id: user.id }, mockTracing()),
    ).resolves.toEqual(user);
  });
});
