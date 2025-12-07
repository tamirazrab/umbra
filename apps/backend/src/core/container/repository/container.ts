import { IRepository } from "@/infra/repository";

import type { ContainerEntity } from "../entity/container";
import type {
	ContainerListInput,
	ContainerListOutput,
} from "../use-cases/container-list";

export abstract class IContainerRepository extends IRepository<ContainerEntity> {
	abstract paginate(input: ContainerListInput): Promise<ContainerListOutput>;
}
