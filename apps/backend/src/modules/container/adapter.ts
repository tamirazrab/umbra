import type {
	ContainerCreateInput,
	ContainerCreateOutput,
} from "@/core/container/use-cases/container-create";
import type {
	ContainerDeleteInput,
	ContainerDeleteOutput,
} from "@/core/container/use-cases/container-delete";
import type {
	ContainerGetByIdInput,
	ContainerGetByIdOutput,
} from "@/core/container/use-cases/container-get-by-id";
import type {
	ContainerListInput,
	ContainerListOutput,
} from "@/core/container/use-cases/container-list";
import type {
	ContainerUpdateInput,
	ContainerUpdateOutput,
} from "@/core/container/use-cases/container-update";
import type {
	ContainerUpdateStatusInput,
	ContainerUpdateStatusOutput,
} from "@/core/container/use-cases/container-update-status";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";

export abstract class IContainerCreateAdapter implements IUsecase {
	abstract execute(
		input: ContainerCreateInput,
		trace: ApiTracingInput,
	): Promise<ContainerCreateOutput>;
}

export abstract class IContainerUpdateAdapter implements IUsecase {
	abstract execute(
		input: ContainerUpdateInput,
		trace: ApiTracingInput,
	): Promise<ContainerUpdateOutput>;
}

export abstract class IContainerGetByIdAdapter implements IUsecase {
	abstract execute(
		input: ContainerGetByIdInput,
	): Promise<ContainerGetByIdOutput>;
}

export abstract class IContainerListAdapter implements IUsecase {
	abstract execute(input: ContainerListInput): Promise<ContainerListOutput>;
}

export abstract class IContainerDeleteAdapter implements IUsecase {
	abstract execute(
		input: ContainerDeleteInput,
		trace: ApiTracingInput,
	): Promise<ContainerDeleteOutput>;
}

export abstract class IContainerUpdateStatusAdapter implements IUsecase {
	abstract execute(
		input: ContainerUpdateStatusInput,
		trace: ApiTracingInput,
	): Promise<ContainerUpdateStatusOutput>;
}
