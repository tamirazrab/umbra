import type { ILoggerAdapter } from "@/infra/logger";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator } from "@/utils/validator";

import type { LogEntity } from "../entity/log";
import type { ILogRepository } from "../repository/log";
import { ValidateSchema } from "@/utils/decorators";

export const LogListSchema = InputValidator.object({
  flowId: InputValidator.number().int().positive().nullish(),
});

export type LogListInput = Infer<typeof LogListSchema>;
export type LogListOutput = LogEntity[];

export class LogListUsecase implements IUsecase {
  constructor(
    private readonly logRepository: ILogRepository,
    private readonly loggerService: ILoggerAdapter,
  ) {}

  @ValidateSchema(LogListSchema)
  async execute(
    input: LogListInput,
    { tracing }: ApiTracingInput,
  ): Promise<LogListOutput> {
    let logs: LogEntity[];

    if (input.flowId) {
      logs = await this.logRepository.findByFlowId(input.flowId);
    } else {
      logs = await this.logRepository.find({});
    }

    this.loggerService.info({
      message: "logs listed successfully",
      obj: { count: logs.length },
    });

    tracing.logEvent("logs-listed", `${logs.length} logs retrieved`);

    return logs;
  }
}
