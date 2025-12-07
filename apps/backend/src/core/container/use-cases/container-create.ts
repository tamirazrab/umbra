import type { ILoggerAdapter } from "@/infra/logger";
import type { CreatedModel } from "@/infra/repository";
import { ValidateSchema } from "@/utils/decorators";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";
import { UUIDUtils } from "@/utils/uuid";
import type { Infer } from "@/utils/validator";
import {
	ContainerEntity,
	ContainerEntitySchema,
	ContainerStatus,
} from "../entity/container";
import type { IContainerRepository } from "../repository/container";

export const ContainerCreateSchema = ContainerEntitySchema.pick({
	name: true,
	localId: true,
	image: true,
}).partial();

export class ContainerCreateUsecase implements IUsecase {
	constructor(
		private readonly containerRepository: IContainerRepository,
		private readonly loggerService: ILoggerAdapter,
	) {}

	@ValidateSchema(ContainerCreateSchema)
	async execute(
		input: ContainerCreateInput,
		{ tracing }: ApiTracingInput,
	): Promise<ContainerCreateOutput> {
		const entity = new ContainerEntity({
			id: UUIDUtils.create(),
			name: input.name ?? null,
			localId: input.localId ?? null,
			image: input.image ?? null,
			status: ContainerStatus.STARTING,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		const container = await this.containerRepository.create(entity);

		this.loggerService.info({
			message: "container created successfully",
			obj: { container },
		});

		tracing.logEvent("container-created", `container: ${container.id} created`);

		return container;
	}
}

export type ContainerCreateInput = Infer<typeof ContainerCreateSchema>;
export type ContainerCreateOutput = CreatedModel;
