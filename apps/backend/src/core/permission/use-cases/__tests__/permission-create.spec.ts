import { Test } from '@nestjs/testing';

import { ILoggerAdapter } from '@/infra/logger';
import { CreatedModel } from '@/infra/repository';
import { IPermissionCreateAdapter } from '@/modules/permission/adapter';
import { ApiConflictException } from '@/utils/exception';
import { ZodExceptionIssue } from '@/utils/validator';

import { PermissionEntity } from '../../entity/permission';
import { IPermissionRepository } from '../../repository/permission';
import { PermissionCreateInput, PermissionCreateUsecase } from '../permission-create';
import { mockReturnValue, expectZodError, nameOf, getUUID, mockResolvedValue } from '@/test/mock';
import { describe, beforeEach, test, expect } from 'vitest';

describe(PermissionCreateUsecase.name, () => {
  let usecase: IPermissionCreateAdapter;
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
          provide: IPermissionCreateAdapter,
          useFactory: (permissionRepository: IPermissionRepository, logger: ILoggerAdapter) => {
            return new PermissionCreateUsecase(permissionRepository, logger);
          },
          inject: [IPermissionRepository, ILoggerAdapter]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionCreateAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute({} as PermissionCreateInput),
      (issues: ZodExceptionIssue[]) => {
        expect(issues).toEqual([{ message: 'Required', path: nameOf<PermissionCreateInput>('name') }]);
      }
    );
  });

  const input: PermissionCreateInput = {
    name: 'name:permission'
  };

  const output: PermissionEntity = new PermissionEntity({ id: getUUID(), name: input.name });

  test('when permission exists, should expect an error', async () => {
    repository.findOne = mockResolvedValue<PermissionEntity>(output);

    await expect(usecase.execute(input)).rejects.toThrow(ApiConflictException);
  });

  test('when permission created successfully, should expect a permission created', async () => {
    repository.create = mockResolvedValue<CreatedModel>({ created: true, id: getUUID() });
    repository.findOne = mockResolvedValue<PermissionEntity>(null);

    await expect(usecase.execute(input)).resolves.toBeInstanceOf(PermissionEntity);
  });
});
