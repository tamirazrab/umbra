import { Test } from '@nestjs/testing';

import { IPermissionGetByIdAdapter } from '@/modules/permission/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionGetByIdInput, PermissionGetByIdUsecase } from '../permission-get-by-id';
import { PermissionEntity } from './../../entity/permission';
import { expectZodError, nameOf, getUUID, mockResolvedValue } from '@/test/mock';
import { describe, beforeEach, test, expect } from 'vitest';

describe(PermissionGetByIdUsecase.name, () => {
  let usecase: IPermissionGetByIdAdapter;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IPermissionGetByIdAdapter,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionGetByIdUsecase(permissionRepository);
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionGetByIdAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as PermissionGetByIdInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: nameOf<PermissionGetByIdInput>('id') }]);
      }
    );
  });

  const input: PermissionGetByIdInput = {
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

  test('when permission found, should expect a permission found', async () => {
    repository.findById = mockResolvedValue<PermissionEntity>(permission);

    await expect(usecase.execute(input)).resolves.toEqual(permission);
  });
});
