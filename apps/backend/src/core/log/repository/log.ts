import type { CreatedModel, UpdatedModel } from "@/infra/repository";

import type { LogEntity } from "../entity/log";
import { ObjectLiteral } from "typeorm";

export abstract class ILogRepository {
  abstract create(entity: LogEntity): Promise<CreatedModel>;
  abstract find(filter: ObjectLiteral): Promise<LogEntity[]>;
  abstract findOne(filter: ObjectLiteral): Promise<LogEntity | null>;
  abstract findById(id: number): Promise<LogEntity | null>;
  abstract updateOne(
    filter: ObjectLiteral,
    entity: LogEntity,
  ): Promise<UpdatedModel>;
  abstract deleteOne(id: number): Promise<void>;
  abstract findByFlowId(flowId: number): Promise<LogEntity[]>;
}
