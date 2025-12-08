import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { IUserDeleteAdapter } from '@/modules/user/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import { UserDeleteInput, UserDeleteUsecase } from '../user-delete';

import { beforeEach, describe, expect, test } from "vitest";
import { expectZodError, mockTracing, mockResolvedValue, getUUID, nameOf } from '@/test/mock';

describe(UserDeleteUsecase.name, () => {
  let usecase: IUserDeleteAdapter;
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
          provide: IUserDeleteAdapter,
          useFactory: (userRepository: IUserRepository) => {
            return new UserDeleteUsecase(userRepository);
          },
          inject: [IUserRepository]
        }
      ]
    }).compile();

    usecase = app.get(IUserDeleteAdapter);
    repository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({ id: 'uuid' } as UserDeleteInput, mockTracing()),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Invalid uuid', path: nameOf<UserDeleteInput>('id') }]);
      }
    );
  });

  test('when user not found, should expect an error', async () => {
    repository.findOneWithRelation = mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute({ id: getUUID() }, mockTracing())).rejects.toThrow(
      ApiNotFoundException
    );
  });

  const user = new UserEntity({
    id: getUUID(),
    email: 'admin@admin.com',
    name: '*Admin',
    roles: [new RoleEntity({ id: getUUID(), name: RoleEnum.USER })],
    password: { id: getUUID(), password: '****' }
  });

  test('when user deleted successfully, should expect an user deleted.', async () => {
    repository.findOneWithRelation = mockResolvedValue<UserEntity>(user);
    repository.softRemove = mockResolvedValue<UserEntity>();

    await expect(usecase.execute({ id: getUUID() }, mockTracing())).resolves.toEqual(
      expect.any(UserEntity)
    );
    expect(repository.softRemove).toHaveBeenCalled();
  });
});
