import type {
	FlowCreateInput,
	FlowCreateOutput,
} from "@/core/flow/use-cases/flow-create";
import type {
	FlowDeleteInput,
	FlowDeleteOutput,
} from "@/core/flow/use-cases/flow-delete";
import type {
	FlowFinishInput,
	FlowFinishOutput,
} from "@/core/flow/use-cases/flow-finish";
import type {
	FlowGetByIdInput,
	FlowGetByIdOutput,
} from "@/core/flow/use-cases/flow-get-by-id";
import type {
	FlowListInput,
	FlowListOutput,
} from "@/core/flow/use-cases/flow-list";
import type {
	FlowUpdateInput,
	FlowUpdateOutput,
} from "@/core/flow/use-cases/flow-update";
import type {
	FlowUpdateStatusInput,
	FlowUpdateStatusOutput,
} from "@/core/flow/use-cases/flow-update-status";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";

export abstract class IFlowCreateAdapter implements IUsecase {
	abstract execute(
		input: FlowCreateInput,
		trace: ApiTracingInput,
	): Promise<FlowCreateOutput>;
}

export abstract class IFlowUpdateAdapter implements IUsecase {
	abstract execute(
		input: FlowUpdateInput,
		trace: ApiTracingInput,
	): Promise<FlowUpdateOutput>;
}

export abstract class IFlowGetByIdAdapter implements IUsecase {
	abstract execute(input: FlowGetByIdInput): Promise<FlowGetByIdOutput>;
}

export abstract class IFlowListAdapter implements IUsecase {
	abstract execute(input: FlowListInput): Promise<FlowListOutput>;
}

export abstract class IFlowDeleteAdapter implements IUsecase {
	abstract execute(
		input: FlowDeleteInput,
		trace: ApiTracingInput,
	): Promise<FlowDeleteOutput>;
}

export abstract class IFlowUpdateStatusAdapter implements IUsecase {
	abstract execute(
		input: FlowUpdateStatusInput,
		trace: ApiTracingInput,
	): Promise<FlowUpdateStatusOutput>;
}

export abstract class IFlowFinishAdapter implements IUsecase {
	abstract execute(
		input: FlowFinishInput,
		trace: ApiTracingInput,
	): Promise<FlowFinishOutput>;
}
