import type { ILoggerAdapter } from "@/infra/logger";
import { ApiNotFoundException } from "@/utils/exception";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { type Infer, InputValidator, ValidateSchema } from "@/utils/validator";

import type { LogEntity } from "../entity/log";
import type { ILogRepository } from "../repository/log";

export const LogGetByIdSchema = InputValidator.object({
  id: InputValidator.number().int().positive(),
});

export type LogGetByIdInput = Infer<typeof LogGetByIdSchema>;
export type LogGetByIdOutput = LogEntity;

export class LogGetByIdUsecase implements IUsecase {
  constructor(
    private readonly logRepository: ILogRepository,
    private readonly loggerService: ILoggerAdapter,
  ) {}

  @ValidateSchema(LogGetByIdSchema)
  async execute(
    input: LogGetByIdInput,
    { tracing }: ApiTracingInput,
  ): Promise<LogGetByIdOutput> {
    const log = await this.logRepository.findById(input.id);

    if (!log) {
      throw new ApiNotFoundException("logNotFound");
    }

    this.loggerService.info({
      message: "log retrieved successfully",
      obj: { log },
    });

    tracing.logEvent("log-retrieved", `log: ${log.id} retrieved`);

    return log;
  }
}
