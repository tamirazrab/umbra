import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { UpdatedModel } from '@/infra/repository';
import { IPermissionUpdateAdapter } from '@/modules/permission/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionUpdateInput, PermissionUpdateUsecase } from '../permission-update';
import { PermissionEntity } from './../../entity/permission';
import { mockReturnValue, expectZodError, nameOf, getUUID, mockResolvedValue } from '@/test/mock';
import { describe, beforeEach, test, expect } from 'vitest';

describe(PermissionUpdateUsecase.name, () => {
  let usecase: IPermissionUpdateAdapter;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: ILoggerAdapter,
          useValue: {
            info: mockReturnValue<void>()
          }
        },
        {
          provide: IPermissionUpdateAdapter,
          useFactory: (permissionRepository: IPermissionRepository, logger: ILoggerAdapter) => {
            return new PermissionUpdateUsecase(permissionRepository, logger);
          },
          inject: [IPermissionRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionUpdateAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as PermissionUpdateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: nameOf<PermissionUpdateInput>('id') }]);
      }
    );
  });

  const input: PermissionUpdateInput = {
    id: getUUID()
  };

  test('when permission not found, should expect an error', async () => {
    repository.findById = mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permission = new PermissionEntity({
    id: getUUID(),
    name: 'name:permission'
  });

  test('when permission exists, should expect an error', async () => {
    repository.findById = mockResolvedValue<PermissionEntity>(permission);
    repository.existsOnUpdate = mockResolvedValue<boolean>(true);

    await expect(usecase.execute({ ...input, name: 'permission:create' })).rejects.toThrow(ApiConflictException);
  });

  test('when permission updated successfully, should expect an permission updated', async () => {
    repository.findById = mockResolvedValue<PermissionEntity>(permission);
    repository.updateOne = mockResolvedValue<UpdatedModel>(null);
    repository.existsOnUpdate = mockResolvedValue<boolean>(false);

    await expect(usecase.execute(input)).resolves.toEqual(permission);
  });
});
