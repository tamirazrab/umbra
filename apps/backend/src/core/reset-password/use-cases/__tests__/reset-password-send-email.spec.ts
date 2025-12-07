import { Test } from '@nestjs/testing';

import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { UserEntity } from '@/core/user/entity/user';
import { IUserRepository } from '@/core/user/repository/user';
import { CreatedModel } from '@/infra/repository';
import { ISecretsAdapter } from '@/infra/secrets';
import { EmitEventOutput, IEventAdapter } from '@/libs/event';
import { ITokenAdapter, SignOutput } from '@/libs/token';
import { IConfirmResetPasswordAdapter, ISendEmailResetPasswordAdapter } from '@/modules/reset-password/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { ResetPasswordEntity } from '../../entity/reset-password';
import { IResetPasswordRepository } from '../../repository/reset-password';
import { ResetPasswordSendEmailInput, ResetPasswordSendEmailUsecase } from '../reset-password-send-email';
import { mockReturnValue, mockResolvedValue, expectZodError, nameOf, getUUID } from '@/test/mock';
import { describe, beforeEach, test, expect } from 'vitest';

describe(ResetPasswordSendEmailUsecase.name, () => {
  let usecase: ISendEmailResetPasswordAdapter;
  let repository: IResetPasswordRepository;
  let userRepository: IUserRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IUserRepository,
          useValue: {}
        },
        {
          provide: ISecretsAdapter,
          useValue: {
            HOST: 'localhost'
          }
        },
        {
          provide: IResetPasswordRepository,
          useValue: {}
        },
        {
          provide: ITokenAdapter,
          useValue: {
            sign: mockReturnValue<SignOutput>({ token: 'token' })
          }
        },
        {
          provide: IEventAdapter,
          useValue: {
            emit: mockResolvedValue<EmitEventOutput>()
          }
        },
        {
          provide: IConfirmResetPasswordAdapter,
          useFactory: (
            repository: IResetPasswordRepository,
            userRepository: IUserRepository,
            token: ITokenAdapter,
            event: IEventAdapter,
            secret: ISecretsAdapter
          ) => {
            return new ResetPasswordSendEmailUsecase(repository, userRepository, token, event, secret);
          },
          inject: [IResetPasswordRepository, IUserRepository, ITokenAdapter, IEventAdapter, ISecretsAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IConfirmResetPasswordAdapter);
    repository = app.get(IResetPasswordRepository);
    userRepository = app.get(IUserRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as ResetPasswordSendEmailInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: nameOf<ResetPasswordSendEmailInput>('email') }]);
      }
    );
  });

  const input: ResetPasswordSendEmailInput = { email: 'admin@admin.com' };

  test('when user not found, should expect an error', async () => {
    userRepository.findOne = mockResolvedValue<UserEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const user = new UserEntity({
    id: getUUID(),
    email: 'admin@admin.com',
    name: 'Admin',
    roles: [new RoleEntity({ id: getUUID(), name: RoleEnum.USER })]
  });

  const resetPassword = new ResetPasswordEntity({ id: getUUID(), token: 'token', user });

  test('when token was founded, should expect void', async () => {
    userRepository.findOne = mockResolvedValue<UserEntity>(user);
    repository.findByIdUserId = mockResolvedValue<ResetPasswordEntity>(resetPassword);

    await expect(usecase.execute(input)).resolves.toBeUndefined();
  });

  test('when token was not founded, should expect void', async () => {
    userRepository.findOne = mockResolvedValue<UserEntity>(user);
    repository.findByIdUserId = mockResolvedValue<ResetPasswordEntity>(null);
    repository.create = mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
  });
});
