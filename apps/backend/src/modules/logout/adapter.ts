import type {
	LogoutInput,
	LogoutOutput,
} from "@/core/user/use-cases/user-logout";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";

export abstract class ILogoutAdapter implements IUsecase {
	abstract execute(
		input: LogoutInput,
		trace: ApiTracingInput,
	): Promise<LogoutOutput>;
}
