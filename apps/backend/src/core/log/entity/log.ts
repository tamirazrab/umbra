import { BaseEntity } from "@/utils/entity";
import { type Infer, InputValidator } from "@/utils/validator";

const ID = InputValidator.number().int().positive();
const Message = InputValidator.string().trim().min(1);
const Type = InputValidator.enum(["input", "output"]);
const FlowId = InputValidator.number().int().positive().nullish();
const CreatedAt = InputValidator.date().nullish();

export const LogEntitySchema = InputValidator.object({
  id: ID,
  message: Message,
  type: Type,
  flowId: FlowId,
  createdAt: CreatedAt,
});

export type Log = Infer<typeof LogEntitySchema>;

export enum LogType {
  INPUT = "input",
  OUTPUT = "output",
}

export class LogEntity extends BaseEntity<LogEntity>() {
  message!: string;

  type!: LogType;

  flowId!: number | null;

  constructor(entity: Log) {
    super(LogEntitySchema);
    Object.assign(this, this.validate(entity));
  }

  validate<T>(entity: T): T {
    Object.assign(this, { id: (entity as unknown as Log).id });
    return this.schema.parse(entity) as T;
  }
}
