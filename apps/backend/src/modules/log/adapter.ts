import type {
  LogCreateInput,
  LogCreateOutput,
} from "@/core/log/use-cases/log-create";
import type {
  LogDeleteInput,
  LogDeleteOutput,
} from "@/core/log/use-cases/log-delete";
import type {
  LogGetByIdInput,
  LogGetByIdOutput,
} from "@/core/log/use-cases/log-get-by-id";
import type {
  LogListInput,
  LogListOutput,
} from "@/core/log/use-cases/log-list";
import type { ApiTracingInput } from "@/utils/request";

export abstract class ILogCreateAdapter {
  abstract execute(
    input: LogCreateInput,
    trace: ApiTracingInput,
  ): Promise<LogCreateOutput>;
}

export abstract class ILogListAdapter {
  abstract execute(
    input: LogListInput,
    trace: ApiTracingInput,
  ): Promise<LogListOutput>;
}

export abstract class ILogGetByIdAdapter {
  abstract execute(
    input: LogGetByIdInput,
    trace: ApiTracingInput,
  ): Promise<LogGetByIdOutput>;
}

export abstract class ILogDeleteAdapter {
  abstract execute(
    input: LogDeleteInput,
    trace: ApiTracingInput,
  ): Promise<LogDeleteOutput>;
}
