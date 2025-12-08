import { Test } from '@nestjs/testing';


import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { ITokenAdapter, SignOutput } from '@/libs/token';
import { IRefreshTokenAdapter } from '@/modules/login/adapter';
import { ApiBadRequestException, ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { UserEntity } from '../../entity/user';
import { IUserRepository } from '../../repository/user';
import {
  RefreshTokenInput,
  RefreshTokenOutput,
  RefreshTokenUsecase,
  UserRefreshTokenVerifyInput
} from '../user-refresh-token';
import { beforeEach, test, expect, describe } from 'vitest';
import { mockResolvedValue, expectZodError, nameOf, mockImplementation, getUUID, mockReturnValue } from '@/test/mock';

describe(RefreshTokenUsecase.name, () => {
  let usecase: IRefreshTokenAdapter;
  let repository: IUserRepository;
  let token: ITokenAdapter;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {
            verify: mockResolvedValue<UserRefreshTokenVerifyInput>()
          }
        },
        {
          provide: IRefreshTokenAdapter,
          useFactory: (repository: IUserRepository, token: ITokenAdapter) => {
            return new RefreshTokenUsecase(repository, token);
          },
          inject: [IUserRepository, ITokenAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IRefreshTokenAdapter);
    repository = app.get(IUserRepository);
    token = app.get(ITokenAdapter);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as RefreshTokenInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: nameOf<RefreshTokenInput>('refreshToken') }]);
      }
    );
  });

  const input: RefreshTokenInput = { refreshToken: '<token>' };
  test('when token is incorrect, should expect an error', async () => {
    token.verify = mockImplementation<UserRefreshTokenVerifyInput>(() => ({
      userId: null
    }));
    repository.findOne = mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiBadRequestException);
  });

  test('when user not found, should expect an error', async () => {
    token.verify = mockImplementation<UserRefreshTokenVerifyInput>(() => {
      return {
        userId: getUUID()
      };
    });
    repository.findOne = mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: getUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: getUUID(), name: RoleEnum.USER })],
    password: { id: getUUID(), password: '***' }
  });

  test('when user role not found, should expect an error', async () => {
    token.verify = mockImplementation<UserRefreshTokenVerifyInput>(() => {
      return {
        userId: getUUID()
      };
    });
    repository.findOne = mockResolvedValue<UserEntity>({ ...user, roles: [] });

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when user refresh token successfully, should expect a token', async () => {
    token.verify = mockImplementation<UserRefreshTokenVerifyInput>(() => ({
      userId: getUUID()
    }));
    token.sign = mockReturnValue<SignOutput>({ token: '<token>' });
    user.password.password = '69bf0bc46f51b33377c4f3d92caf876714f6bbbe99e7544487327920873f9820';
    repository.findOne = mockResolvedValue<UserEntity>(user);

    await expect(usecase.execute(input)).resolves.toEqual({
      accessToken: expect.any(String),
      refreshToken: expect.any(String)
    } as RefreshTokenOutput);
  });
});
