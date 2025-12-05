import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";

import { LogEntity } from "@/core/log/entity/log";
import type { ILogRepository } from "@/core/log/repository/log";
import type { CreatedModel, UpdatedModel } from "@/infra/repository";
import type { ObjectLiteral } from "@/utils/types";

import { LogSchema } from "../schemas/log";

@Injectable()
export class LogRepository implements ILogRepository {
  constructor(
    @InjectRepository(LogSchema)
    private readonly repository: Repository<LogSchema>,
  ) {}

  async create(entity: LogEntity): Promise<CreatedModel> {
    const log = await this.repository.save(entity);
    return new LogEntity(log);
  }

  async find(filter: ObjectLiteral): Promise<LogEntity[]> {
    const logs = await this.repository.find({ where: filter });
    return logs.map((log) => new LogEntity(log));
  }

  async findOne(filter: ObjectLiteral): Promise<LogEntity | null> {
    const log = await this.repository.findOne({ where: filter });
    return log ? new LogEntity(log) : null;
  }

  async findById(id: number): Promise<LogEntity | null> {
    const log = await this.repository.findOne({ where: { id } });
    return log ? new LogEntity(log) : null;
  }

  async updateOne(
    filter: ObjectLiteral,
    entity: LogEntity,
  ): Promise<UpdatedModel> {
    await this.repository.update(filter, entity);
    const updated = await this.repository.findOne({ where: filter });
    if (!updated) {
      throw new Error("Log not found after update");
    }
    return new LogEntity(updated);
  }

  async deleteOne(id: number): Promise<void> {
    await this.repository.delete({ id });
  }

  async findByFlowId(flowId: number): Promise<LogEntity[]> {
    const logs = await this.repository.find({
      where: { flowId },
      order: { createdAt: "ASC" },
    });
    return logs.map((log) => new LogEntity(log));
  }
}
