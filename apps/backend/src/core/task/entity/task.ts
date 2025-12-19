import { BaseEntity } from "@/utils/entity";
import { type Infer, InputValidator } from "@/utils/validator";

const ID = InputValidator.string();
const Type = InputValidator.enum([
	"input",
	"terminal",
	"browser",
	"code",
	"ask",
	"done"
]).nullish();
const Status = InputValidator.enum([
	"in_progress",
	"finished",
	"stopped",
	"failed",
]);
const Args = InputValidator.record(
	InputValidator.string(),
	InputValidator.any(),
).default({});
const Results = InputValidator.string().default("{}");
const Message = InputValidator.string().nullish();
const ToolCallId = InputValidator.string().nullish();
const FlowId = InputValidator.string().nullish();
const CreatedAt = InputValidator.date().nullish();
const UpdatedAt = InputValidator.date().nullish();

export const TaskEntitySchema = InputValidator.object({
	id: ID,
	type: Type,
	status: Status,
	args: Args,
	results: Results,
	message: Message,
	toolCallId: ToolCallId,
	flowId: FlowId,
	createdAt: CreatedAt,
	updatedAt: UpdatedAt,
});

type Task = Infer<typeof TaskEntitySchema>;

export enum TaskType {
	INPUT = "input",
	TERMINAL = "terminal",
	BROWSER = "browser",
	CODE = "code",
	ASK = "ask",
	DONE = "done",
}

export enum TaskStatus {
	IN_PROGRESS = "in_progress",
	FINISHED = "finished",
	STOPPED = "stopped",
	FAILED = "failed",
}

export class TaskEntity extends BaseEntity<TaskEntity>() {
	type!: TaskType | null;

	status!: TaskStatus;

	args!: Record<string, unknown>;

	results!: string;

	message!: string | null;

	toolCallId!: string | null;

	flowId!: string | null;

	constructor(entity: Task) {
		super(TaskEntitySchema);
		Object.assign(this, this.validate(entity));
	}

	validate<T>(entity: T): T {
		Object.assign(this, { id: (entity as unknown as Task).id });
		return this.schema.parse(entity) as T;
	}
}
