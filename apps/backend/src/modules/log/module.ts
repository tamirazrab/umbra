import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ILogRepository } from "@/core/log/repository/log";
import { LogCreateUsecase } from "@/core/log/use-cases/log-create";
import { LogDeleteUsecase } from "@/core/log/use-cases/log-delete";
import { LogGetByIdUsecase } from "@/core/log/use-cases/log-get-by-id";
import { LogListUsecase } from "@/core/log/use-cases/log-list";
import { LogRepository } from "@/infra/database/postgres/repository/log";
import { LogSchema } from "@/infra/database/postgres/schemas/log";
import { ILoggerAdapter, LoggerModule } from "@/infra/logger";

import {
  ILogCreateAdapter,
  ILogDeleteAdapter,
  ILogGetByIdAdapter,
  ILogListAdapter,
} from "./adapter";
import { LogController } from "./controller";

@Module({
  imports: [LoggerModule, TypeOrmModule.forFeature([LogSchema])],
  controllers: [LogController],
  providers: [
    {
      provide: ILogRepository,
      useClass: LogRepository,
    },
    {
      provide: ILogCreateAdapter,
      useFactory: (
        logRepository: ILogRepository,
        loggerService: ILoggerAdapter,
      ) => {
        return new LogCreateUsecase(logRepository, loggerService);
      },
      inject: [ILogRepository, ILoggerAdapter],
    },
    {
      provide: ILogListAdapter,
      useFactory: (
        logRepository: ILogRepository,
        loggerService: ILoggerAdapter,
      ) => {
        return new LogListUsecase(logRepository, loggerService);
      },
      inject: [ILogRepository, ILoggerAdapter],
    },
    {
      provide: ILogGetByIdAdapter,
      useFactory: (
        logRepository: ILogRepository,
        loggerService: ILoggerAdapter,
      ) => {
        return new LogGetByIdUsecase(logRepository, loggerService);
      },
      inject: [ILogRepository, ILoggerAdapter],
    },
    {
      provide: ILogDeleteAdapter,
      useFactory: (
        logRepository: ILogRepository,
        loggerService: ILoggerAdapter,
      ) => {
        return new LogDeleteUsecase(logRepository, loggerService);
      },
      inject: [ILogRepository, ILoggerAdapter],
    },
  ],
  exports: [
    ILogRepository,
    ILogCreateAdapter,
    ILogListAdapter,
    ILogGetByIdAdapter,
    ILogDeleteAdapter,
  ],
})
export class LogModule {}
