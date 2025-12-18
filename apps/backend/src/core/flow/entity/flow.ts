import { BaseEntity } from "@/utils/entity";
import { type Infer, InputValidator } from "@/utils/validator";

const ID = InputValidator.string();
const Name = InputValidator.string().trim().min(1).max(255).nullish();
const Status = InputValidator.enum(["in_progress", "finished"]);
const Model = InputValidator.string().trim().min(1).max(255).nullish();
const ModelProvider = InputValidator.string().trim().min(1).max(255).nullish();
const ContainerId = InputValidator.number().int().positive().nullish();
const CreatedAt = InputValidator.date().nullish();
const UpdatedAt = InputValidator.date().nullish();

export const FlowEntitySchema = InputValidator.object({
	id: ID,
	name: Name,
	status: Status,
	model: Model,
	modelProvider: ModelProvider,
	containerId: ContainerId,
	createdAt: CreatedAt,
	updatedAt: UpdatedAt,
});

type Flow = Infer<typeof FlowEntitySchema>;

export enum FlowStatus {
	IN_PROGRESS = "in_progress",
	FINISHED = "finished",
}

export class FlowEntity extends BaseEntity<Flow>() {
	name!: string | null;

	status!: FlowStatus;

	model!: string | null;

	modelProvider!: string | null;

	containerId!: number | null;

	constructor(entity: Flow) {
		super(FlowEntitySchema);
		Object.assign(this, this.validate(entity));
	}
}
