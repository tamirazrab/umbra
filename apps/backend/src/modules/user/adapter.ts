import type {
  UserChangePasswordInput,
  UserChangePasswordOutput,
} from "@/core/user/use-cases/user-change-password";
import type {
  UserCreateInput,
  UserCreateOutput,
} from "@/core/user/use-cases/user-create";
import type {
  UserDeleteInput,
  UserDeleteOutput,
} from "@/core/user/use-cases/user-delete";
import type {
  UserGetByIdInput,
  UserGetByIdOutput,
} from "@/core/user/use-cases/user-get-by-id";
import type {
  UserListInput,
  UserListOutput,
} from "@/core/user/use-cases/user-list";
import type {
  UserUpdateInput,
  UserUpdateOutput,
} from "@/core/user/use-cases/user-update";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";

export abstract class IUserCreateAdapter implements IUsecase {
  abstract execute(
    input: UserCreateInput,
    trace: ApiTracingInput,
  ): Promise<UserCreateOutput>;
}

export abstract class IUserUpdateAdapter implements IUsecase {
  abstract execute(
    input: UserUpdateInput,
    trace: ApiTracingInput,
  ): Promise<UserUpdateOutput>;
}

export abstract class IUserListAdapter implements IUsecase {
  abstract execute(input: UserListInput): Promise<UserListOutput>;
}

export abstract class IUserDeleteAdapter implements IUsecase {
  abstract execute(
    input: UserDeleteInput,
    trace: ApiTracingInput,
  ): Promise<UserDeleteOutput>;
}

export abstract class IUserGetByIdAdapter implements IUsecase {
  abstract execute(input: UserGetByIdInput): Promise<UserGetByIdOutput>;
}

export abstract class IUserChangePasswordAdapter implements IUsecase {
  abstract execute(
    input: UserChangePasswordInput,
  ): Promise<UserChangePasswordOutput>;
}
