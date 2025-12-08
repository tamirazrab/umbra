import type { LoginInput, LoginOutput } from "@/core/user/use-cases/user-login";
import type {
	RefreshTokenInput,
	RefreshTokenOutput,
} from "@/core/user/use-cases/user-refresh-token";
import type { ApiTracingInput } from "@/utils/request";
import type { IUsecase } from "@/utils/usecase";

export abstract class ILoginAdapter implements IUsecase {
	abstract execute(
		input: LoginInput,
		trace: ApiTracingInput,
	): Promise<LoginOutput>;
}

export abstract class IRefreshTokenAdapter implements IUsecase {
	abstract execute(input: RefreshTokenInput): Promise<RefreshTokenOutput>;
}
