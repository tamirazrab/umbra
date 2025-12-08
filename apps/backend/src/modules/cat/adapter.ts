import type {
  CatCreateInput,
  CatCreateOutput,
} from "@/core/cat/use-cases/cat-create";
import type {
  CatDeleteInput,
  CatDeleteOutput,
} from "@/core/cat/use-cases/cat-delete";
import type {
  CatGetByIdInput,
  CatGetByIdOutput,
} from "@/core/cat/use-cases/cat-get-by-id";
import type {
  CatListInput,
  CatListOutput,
} from "@/core/cat/use-cases/cat-list";
import type {
  CatUpdateInput,
  CatUpdateOutput,
} from "@/core/cat/use-cases/cat-update";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";

export abstract class ICatCreateAdapter implements IUsecase {
  abstract execute(
    input: CatCreateInput,
    trace: ApiTracingInput,
  ): Promise<CatCreateOutput>;
}

export abstract class ICatUpdateAdapter implements IUsecase {
  abstract execute(
    input: CatUpdateInput,
    trace: ApiTracingInput,
  ): Promise<CatUpdateOutput>;
}

export abstract class ICatGetByIdAdapter implements IUsecase {
  abstract execute(input: CatGetByIdInput): Promise<CatGetByIdOutput>;
}

export abstract class ICatListAdapter implements IUsecase {
  abstract execute(input: CatListInput): Promise<CatListOutput>;
}

export abstract class ICatDeleteAdapter implements IUsecase {
  abstract execute(
    input: CatDeleteInput,
    trace: ApiTracingInput,
  ): Promise<CatDeleteOutput>;
}
