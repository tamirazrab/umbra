import { IRepository } from "@/infra/repository";

import type { FlowEntity } from "../entity/flow";
import type { FlowListInput, FlowListOutput } from "../use-cases/flow-list";

export abstract class IFlowRepository extends IRepository<FlowEntity> {
	abstract paginate(input: FlowListInput): Promise<FlowListOutput>;
}
