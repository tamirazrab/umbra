import { Test } from '@nestjs/testing';

import { PermissionEntity } from '@/core/permission/entity/permission';
import { IPermissionRepository } from '@/core/permission/repository/permission';
import { CreatedModel } from '@/infra/repository';
import { IRoleAddPermissionAdapter } from '@/modules/role/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { UUIDUtils } from '@/utils/uuid';
import { ZodExceptionIssue } from '@/utils/validator';

import { RoleEntity, RoleEnum } from '../../entity/role';
import { IRoleRepository } from '../../repository/role';
import { RoleAddPermissionInput, RoleAddPermissionUsecase } from '../role-add-permission';
import { expectZodError, nameOf, getUUID, mockResolvedValue } from '@/test/mock';
import { describe, beforeEach, test, expect } from 'vitest';

describe(RoleAddPermissionUsecase.name, () => {
  let usecase: IRoleAddPermissionAdapter;
  let repository: IRoleRepository;
  let permissionRepository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IRoleAddPermissionAdapter,
          useFactory: (roleRepository: IRoleRepository, permissionRepository: IPermissionRepository) => {
            return new RoleAddPermissionUsecase(roleRepository, permissionRepository);
          },
          inject: [IRoleRepository, IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IRoleAddPermissionAdapter);
    repository = app.get(IRoleRepository);
    permissionRepository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as RoleAddPermissionInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([
          { message: 'Required', path: nameOf<RoleAddPermissionInput>('id') },
          { message: 'Required', path: nameOf<RoleAddPermissionInput>('permissions') }
        ]);
      }
    );
  });

  const input: RoleAddPermissionInput = {
    id: getUUID(),
    permissions: ['user:create', 'user:list']
  };

  test('when role not exists, should expect an error', async () => {
    repository.findOne = mockResolvedValue<RoleEntity>(null);

    await expect(usecase.execute(input)).rejects.toThrow(ApiNotFoundException);
  });

  const permissions = [
    new PermissionEntity({ id: UUIDUtils.create(), name: 'user:create' }),
    new PermissionEntity({ id: UUIDUtils.create(), name: 'user:update' })
  ];

  const role = new RoleEntity({ id: UUIDUtils.create(), name: RoleEnum.USER, permissions });

  test('when delete permission with associated permission successfully, should expect an update permission', async () => {
    repository.findOne = mockResolvedValue<RoleEntity>(role);
    permissionRepository.findIn = mockResolvedValue<PermissionEntity[]>(permissions);
    repository.create = mockResolvedValue<CreatedModel>();

    await expect(usecase.execute(input)).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });

  test('when delete permission without associated permission successfully, should expect an update permission', async () => {
    repository.findOne = mockResolvedValue<RoleEntity>({
      ...role,
      permissions: role.permissions.filter((p) => p.name !== 'user:create')
    });
    permissionRepository.findIn = mockResolvedValue<PermissionEntity[]>(permissions);
    repository.create = mockResolvedValue<CreatedModel>();

    await expect(usecase.execute({ ...input, permissions: ['user:create'] })).resolves.toBeUndefined();
    expect(repository.create).toHaveBeenCalled();
  });
});
