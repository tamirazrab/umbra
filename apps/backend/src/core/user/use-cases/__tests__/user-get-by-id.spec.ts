import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IUserGetByIdAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserGetByIdInput, UserGetByIdUsecase } from '../user-get-by-id';

import { beforeEach, describe, expect, test } from "vitest";
import { expectZodError, nameOf, mockResolvedValue, getUUID } from 'test/mock';

describe(UserGetByIdUsecase.name, () => {
  let usecase: IUserGetByIdAdapter;
  let repository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: IUserGetByIdAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserGetByIdUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserGetByIdAdapter);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as UserGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: nameOf<UserGetByIdInput>('id') }]);
      }
    );
  });

  test('when user not found, should expect an errror', async () => {
    repository.findOne = mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute({ id: getUUID() })).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: getUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: getUUID(), name: RoleEnum.USER })]
  });

  test('when user getById successfully, should expect a user', async () => {
    repository.findOne = mockResolvedValue<UserEntity>(user);

    await expect(usecase.execute({ id: getUUID() })).resolves.toEqual(user);
  });
});
