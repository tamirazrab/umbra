import { Test } from '@nestjs/testing';

import { PermissionDeleteInput, PermissionDeleteUsecase } from '@/core/permission/use-cases/permission-delete';
import { RoleEntity, RoleEnum } from '@/core/role/entity/role';
import { CreatedModel } from '@/infra/repository';
import { IPermissionDeleteAdapter } from '@/modules/permission/adapter';
import { ApiConflictException, ApiNotFoundException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionEntity } from './../../entity/permission';
import { expectZodError, nameOf, getUUID, mockResolvedValue } from '@/test/mock';
import { describe, beforeEach, test, expect } from 'vitest';

describe(PermissionDeleteUsecase.name, () => {
  let usecase: IPermissionDeleteAdapter;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IPermissionDeleteAdapter,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionDeleteUsecase(permissionRepository);
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionDeleteAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as PermissionDeleteInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: nameOf<PermissionDeleteInput>('id') }]);
      }
    );
  });

  const input: PermissionDeleteInput = {
    id: getUUID()
  };

  test('when permission not found, should expect an error', async () => {
    repository.findOneWithRelation = mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  test('when permission has association with role, should expect an error', async () => {
    repository.findOneWithRelation = mockResolvedValue<PermissionEntity>({
      roles: [{ name: RoleEnum.BACKOFFICE } as RoleEntity]
    });

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  const permission = new PermissionEntity({
    id: getUUID(),
    name: 'name:permission'
  });

  test('when permission deleted successfully, should expect a permission deleted', async () => {
    repository.findOneWithRelation = mockResolvedValue<PermissionEntity>(permission);
    repository.create = mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toEqual({
      ...permission,
      deletedAt: expect.any(Date)
    });
  });
});
