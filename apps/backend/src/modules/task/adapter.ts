import type {
	TaskCreateInput,
	TaskCreateOutput,
} from "@/core/task/use-cases/task-create";
import type {
	TaskDeleteInput,
	TaskDeleteOutput,
} from "@/core/task/use-cases/task-delete";
import type {
	TaskFindByFlowInput,
	TaskFindByFlowOutput,
} from "@/core/task/use-cases/task-find-by-flow";
import type {
	TaskGetByIdInput,
	TaskGetByIdOutput,
} from "@/core/task/use-cases/task-get-by-id";
import type {
	TaskListInput,
	TaskListOutput,
} from "@/core/task/use-cases/task-list";
import type {
	TaskUpdateInput,
	TaskUpdateOutput,
} from "@/core/task/use-cases/task-update";
import type {
	TaskUpdateResultsInput,
	TaskUpdateResultsOutput,
} from "@/core/task/use-cases/task-update-results";
import type {
	TaskUpdateStatusInput,
	TaskUpdateStatusOutput,
} from "@/core/task/use-cases/task-update-status";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";

export abstract class ITaskCreateAdapter implements IUsecase {
	abstract execute(
		input: TaskCreateInput,
		trace: ApiTracingInput,
	): Promise<TaskCreateOutput>;
}

export abstract class ITaskUpdateAdapter implements IUsecase {
	abstract execute(
		input: TaskUpdateInput,
		trace: ApiTracingInput,
	): Promise<TaskUpdateOutput>;
}

export abstract class ITaskGetByIdAdapter implements IUsecase {
	abstract execute(input: TaskGetByIdInput): Promise<TaskGetByIdOutput>;
}

export abstract class ITaskListAdapter implements IUsecase {
	abstract execute(input: TaskListInput): Promise<TaskListOutput>;
}

export abstract class ITaskDeleteAdapter implements IUsecase {
	abstract execute(
		input: TaskDeleteInput,
		trace: ApiTracingInput,
	): Promise<TaskDeleteOutput>;
}

export abstract class ITaskUpdateStatusAdapter implements IUsecase {
	abstract execute(
		input: TaskUpdateStatusInput,
		trace: ApiTracingInput,
	): Promise<TaskUpdateStatusOutput>;
}

export abstract class ITaskUpdateResultsAdapter implements IUsecase {
	abstract execute(
		input: TaskUpdateResultsInput,
		trace: ApiTracingInput,
	): Promise<TaskUpdateResultsOutput>;
}

export abstract class ITaskFindByFlowAdapter implements IUsecase {
	abstract execute(input: TaskFindByFlowInput): Promise<TaskFindByFlowOutput>;
}
