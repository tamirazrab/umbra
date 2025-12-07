import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { IRoleUpdateAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { IRoleRepository } from '../../repository/role';
import { RoleUpdateInput, RoleUpdateUsecase } from '../role-update';
import { RoleEntity, RoleEnum } from './../../entity/role';
import { mockReturnValue, expectZodError, nameOf, getUUID, mockResolvedValue } from '@/test/mock';
import { describe, beforeEach, test, expect } from 'vitest';

describe(RoleUpdateUsecase.name, () => {
  let usecase: IRoleUpdateAdapter;
  let repository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: ILoggerAdapter,
          useValue: {
            info: mockReturnValue<void>()
          }
        },
        {
          provide: IRoleUpdateAdapter,
          useFactory: (roleRepository: IRoleRepository, logger: ILoggerAdapter) => {
            return new RoleUpdateUsecase(roleRepository, logger);
          },
          inject: [IRoleRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IRoleUpdateAdapter);
    repository = app.get(IRoleRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as RoleUpdateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: nameOf<RoleUpdateInput>('id') }]);
      }
    );
  });

  const input: RoleUpdateInput = {
    id: getUUID()
  };

  test('when role not found, should expect an error', async () => {
    repository.findById = mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const role = new RoleEntity({
    id: getUUID(),
    name: RoleEnum.USER
  });

  test('when role updated successfully, should expect an role updated', async () => {
    repository.findById = mockResolvedValue<RoleEntity>(role);
    repository.create = mockResolvedValue<CreatedModel>(null);

    await expect(usecase.execute(input)).resolves.toEqual(role);
  });
});
