import type { ILoggerAdapter } from "@/infra/logger";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator, ValidateSchema } from "@/utils/validator";

import type { ILogRepository } from "../repository/log";

export const LogDeleteSchema = InputValidator.object({
  id: InputValidator.number().int().positive(),
});

export type LogDeleteInput = Infer<typeof LogDeleteSchema>;
export type LogDeleteOutput = void;

export class LogDeleteUsecase implements IUsecase {
  constructor(
    private readonly logRepository: ILogRepository,
    private readonly loggerService: ILoggerAdapter,
  ) {}

  @ValidateSchema(LogDeleteSchema)
  async execute(
    input: LogDeleteInput,
    { tracing }: ApiTracingInput,
  ): Promise<LogDeleteOutput> {
    const log = await this.logRepository.findById(input.id);

    if (!log) {
      throw new ApiNotFoundException("logNotFound");
    }

    await this.logRepository.deleteOne(input.id);

    this.loggerService.info({
      message: "log deleted successfully",
      obj: { logId: input.id },
    });

    tracing.logEvent("log-deleted", `log: ${input.id} deleted`);
  }
}
