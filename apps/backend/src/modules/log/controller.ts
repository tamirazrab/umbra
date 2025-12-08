import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";

import type {
  LogCreateInput,
  LogCreateOutput,
} from "@/core/log/use-cases/log-create";
import type {
  LogDeleteOutput
} from "@/core/log/use-cases/log-delete";
import type {
  LogGetByIdOutput
} from "@/core/log/use-cases/log-get-by-id";
import type {
  LogListInput,
  LogListOutput,
} from "@/core/log/use-cases/log-list";
import type { ApiRequest } from "@/utils/request";

import type {
  ILogCreateAdapter,
  ILogDeleteAdapter,
  ILogGetByIdAdapter,
  ILogListAdapter,
} from "./adapter";

@Controller("logs")
@ApiTags("logs")
@ApiBearerAuth()
export class LogController {
  constructor(
    private readonly createUsecase: ILogCreateAdapter,
    private readonly listUsecase: ILogListAdapter,
    private readonly getByIdUsecase: ILogGetByIdAdapter,
    private readonly deleteUsecase: ILogDeleteAdapter,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new log entry" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        message: { type: "string" },
        type: { type: "string", enum: ["input", "output"] },
        flowId: { type: "number", nullable: true },
      },
      required: ["message", "type"],
    },
  })
  async create(
    @Body() input: LogCreateInput,
    @Req() request: ApiRequest,
  ): Promise<LogCreateOutput> {
    return await this.createUsecase.execute(input, {
      tracing: request.tracing,
      user: request.user,
    });
  }

  @Get()
  @ApiOperation({ summary: "List all logs, optionally filtered by flowId" })
  async list(
    @Query() query: LogListInput,
    @Req() request: ApiRequest,
  ): Promise<LogListOutput> {
    return await this.listUsecase.execute(query, {
      tracing: request.tracing,
      user: request.user,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a log by ID" })
  async getById(
    @Param("id") id: string,
    @Req() request: ApiRequest,
  ): Promise<LogGetByIdOutput> {
    return await this.getByIdUsecase.execute(
      { id: Number(id) },
      {
        tracing: request.tracing,
        user: request.user,
      },
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a log by ID" })
  async delete(
    @Param("id") id: string,
    @Req() request: ApiRequest,
  ): Promise<LogDeleteOutput> {
    return await this.deleteUsecase.execute(
      { id: Number(id) },
      {
        tracing: request.tracing,
        user: request.user,
      },
    );
  }
}
