import { BaseEntity } from "@/utils/entity";
import { type Infer, InputValidator } from "@/utils/validator";

const ID = InputValidator.string();
const Name = InputValidator.string().trim().min(1).max(255).nullish();
const LocalId = InputValidator.string().trim().min(1).max(255).nullish();
const Image = InputValidator.string().trim().min(1).max(255).nullish();
const Status = InputValidator.enum([
	"starting",
	"running",
	"stopped",
	"failed",
]);
const CreatedAt = InputValidator.date().nullish();
const UpdatedAt = InputValidator.date().nullish();

export const ContainerEntitySchema = InputValidator.object({
	id: ID,
	name: Name,
	localId: LocalId,
	image: Image,
	status: Status,
	createdAt: CreatedAt,
	updatedAt: UpdatedAt,
});

type Container = Infer<typeof ContainerEntitySchema>;

export enum ContainerStatus {
	STARTING = "starting",
	RUNNING = "running",
	STOPPED = "stopped",
	FAILED = "failed",
}

export class ContainerEntity extends BaseEntity<ContainerEntity>() {
	name!: string | null;

	localId!: string | null;

	image!: string | null;

	status!: ContainerStatus;

	constructor(entity: Container) {
		super(ContainerEntitySchema);
		Object.assign(this, this.validate(entity));
	}

	validate<T>(entity: T): T {
		Object.assign(this, { id: (entity as unknown as Container).id });
		return this.schema.parse(entity) as T;
	}
}
