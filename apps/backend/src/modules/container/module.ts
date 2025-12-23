import {
	MiddlewareConsumer,
	Module,
	NestModule,
} from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ContainerEntity } from "@/core/container/entity/container";
import { IContainerRepository } from "@/core/container/repository/container";
import { ContainerCreateUsecase } from "@/core/container/use-cases/container-create";
import { ContainerDeleteUsecase } from "@/core/container/use-cases/container-delete";
import { ContainerGetByIdUsecase } from "@/core/container/use-cases/container-get-by-id";
import { ContainerListUsecase } from "@/core/container/use-cases/container-list";
import { ContainerUpdateUsecase } from "@/core/container/use-cases/container-update";
import { ContainerUpdateStatusUsecase } from "@/core/container/use-cases/container-update-status";
import { RedisCacheModule } from "@/infra/cache/redis";
import { ContainerSchema } from "@/infra/database/postgres/schemas/container";
import { ILoggerAdapter, LoggerModule } from "@/infra/logger";
import { TokenLibModule } from "@/libs/token";
import { AuthenticationMiddleware } from "@/middlewares/middlewares";

import {
	IContainerCreateAdapter,
	IContainerDeleteAdapter,
	IContainerGetByIdAdapter,
	IContainerListAdapter,
	IContainerUpdateAdapter,
	IContainerUpdateStatusAdapter,
} from "./adapter";
import { ContainerController } from "./controller";
import { ContainerRepository } from "./repository";

@Module({
	imports: [
		TokenLibModule,
		LoggerModule,
		RedisCacheModule,
		TypeOrmModule.forFeature([ContainerSchema]),
	],
	controllers: [ContainerController],
	providers: [
		{
			provide: IContainerRepository,
			useFactory: (
				repository: Repository<ContainerSchema & ContainerEntity>,
			) => {
				return new ContainerRepository(repository);
			},
			inject: [getRepositoryToken(ContainerSchema)],
		},
		{
			provide: IContainerCreateAdapter,
			useFactory: (
				containerRepository: IContainerRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new ContainerCreateUsecase(containerRepository, loggerService);
			},
			inject: [IContainerRepository, ILoggerAdapter],
		},
		{
			provide: IContainerUpdateAdapter,
			useFactory: (
				containerRepository: IContainerRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new ContainerUpdateUsecase(containerRepository, loggerService);
			},
			inject: [IContainerRepository, ILoggerAdapter],
		},
		{
			provide: IContainerListAdapter,
			useFactory: (containerRepository: IContainerRepository) => {
				return new ContainerListUsecase(containerRepository);
			},
			inject: [IContainerRepository],
		},
		{
			provide: IContainerDeleteAdapter,
			useFactory: (
				containerRepository: IContainerRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new ContainerDeleteUsecase(containerRepository, loggerService);
			},
			inject: [IContainerRepository, ILoggerAdapter],
		},
		{
			provide: IContainerGetByIdAdapter,
			useFactory: (containerRepository: IContainerRepository) => {
				return new ContainerGetByIdUsecase(containerRepository);
			},
			inject: [IContainerRepository],
		},
		{
			provide: IContainerUpdateStatusAdapter,
			useFactory: (
				containerRepository: IContainerRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new ContainerUpdateStatusUsecase(
					containerRepository,
					loggerService,
				);
			},
			inject: [IContainerRepository, ILoggerAdapter],
		},
	],
	exports: [
		IContainerRepository,
		IContainerCreateAdapter,
		IContainerUpdateAdapter,
		IContainerListAdapter,
		IContainerDeleteAdapter,
		IContainerGetByIdAdapter,
		IContainerUpdateStatusAdapter,
	],
})
export class ContainerModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthenticationMiddleware).forRoutes(ContainerController);
	}
}
