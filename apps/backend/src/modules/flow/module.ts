import {
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import type { Repository } from "typeorm";

import type { FlowEntity } from "@/core/flow/entity/flow";
import { IFlowRepository } from "@/core/flow/repository/flow";
import { FlowCreateUsecase } from "@/core/flow/use-cases/flow-create";
import { FlowDeleteUsecase } from "@/core/flow/use-cases/flow-delete";
import { FlowFinishUsecase } from "@/core/flow/use-cases/flow-finish";
import { FlowGetByIdUsecase } from "@/core/flow/use-cases/flow-get-by-id";
import { FlowListUsecase } from "@/core/flow/use-cases/flow-list";
import { FlowUpdateUsecase } from "@/core/flow/use-cases/flow-update";
import { FlowUpdateStatusUsecase } from "@/core/flow/use-cases/flow-update-status";
import { RedisCacheModule } from "@/infra/cache/redis";
import { FlowSchema } from "@/infra/database/postgres/schemas/flow";
import { ILoggerAdapter, LoggerModule } from "@/infra/logger";
import { TokenLibModule } from "@/libs/token";
import { AuthenticationMiddleware } from "@/middlewares/middlewares";

import {
	IFlowCreateAdapter,
	IFlowDeleteAdapter,
	IFlowFinishAdapter,
	IFlowGetByIdAdapter,
	IFlowListAdapter,
	IFlowUpdateAdapter,
	IFlowUpdateStatusAdapter,
} from "./adapter";
import { FlowController } from "./controller";
import { FlowRepository } from "./repository";

@Module({
	imports: [
		TokenLibModule,
		LoggerModule,
		RedisCacheModule,
		TypeOrmModule.forFeature([FlowSchema]),
	],
	controllers: [FlowController],
	providers: [
		{
			provide: IFlowRepository,
			useFactory: (repository: Repository<FlowSchema & FlowEntity>) => {
				return new FlowRepository(repository);
			},
			inject: [getRepositoryToken(FlowSchema)],
		},
		{
			provide: IFlowCreateAdapter,
			useFactory: (
				flowRepository: IFlowRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new FlowCreateUsecase(flowRepository, loggerService);
			},
			inject: [IFlowRepository, ILoggerAdapter],
		},
		{
			provide: IFlowUpdateAdapter,
			useFactory: (
				flowRepository: IFlowRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new FlowUpdateUsecase(flowRepository, loggerService);
			},
			inject: [IFlowRepository, ILoggerAdapter],
		},
		{
			provide: IFlowListAdapter,
			useFactory: (flowRepository: IFlowRepository) => {
				return new FlowListUsecase(flowRepository);
			},
			inject: [IFlowRepository],
		},
		{
			provide: IFlowDeleteAdapter,
			useFactory: (
				flowRepository: IFlowRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new FlowDeleteUsecase(flowRepository, loggerService);
			},
			inject: [IFlowRepository, ILoggerAdapter],
		},
		{
			provide: IFlowGetByIdAdapter,
			useFactory: (flowRepository: IFlowRepository) => {
				return new FlowGetByIdUsecase(flowRepository);
			},
			inject: [IFlowRepository],
		},
		{
			provide: IFlowUpdateStatusAdapter,
			useFactory: (
				flowRepository: IFlowRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new FlowUpdateStatusUsecase(flowRepository, loggerService);
			},
			inject: [IFlowRepository, ILoggerAdapter],
		},
		{
			provide: IFlowFinishAdapter,
			useFactory: (
				flowRepository: IFlowRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new FlowFinishUsecase(flowRepository, loggerService);
			},
			inject: [IFlowRepository, ILoggerAdapter],
		},
	],
	exports: [
		IFlowRepository,
		IFlowCreateAdapter,
		IFlowUpdateAdapter,
		IFlowListAdapter,
		IFlowDeleteAdapter,
		IFlowGetByIdAdapter,
		IFlowUpdateStatusAdapter,
		IFlowFinishAdapter,
	],
})
export class FlowModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthenticationMiddleware).forRoutes(FlowController);
	}
}
