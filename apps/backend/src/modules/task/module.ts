import {
	type MiddlewareConsumer,
	Module,
	type NestModule,
} from "@nestjs/common";
import { getRepositoryToken, TypeOrmModule } from "@nestjs/typeorm";
import type { Repository } from "typeorm";

import type { TaskEntity } from "@/core/task/entity/task";
import { ITaskRepository } from "@/core/task/repository/task";
import { TaskCreateUsecase } from "@/core/task/use-cases/task-create";
import { TaskDeleteUsecase } from "@/core/task/use-cases/task-delete";
import { TaskFindByFlowUsecase } from "@/core/task/use-cases/task-find-by-flow";
import { TaskGetByIdUsecase } from "@/core/task/use-cases/task-get-by-id";
import { TaskListUsecase } from "@/core/task/use-cases/task-list";
import { TaskUpdateUsecase } from "@/core/task/use-cases/task-update";
import { TaskUpdateResultsUsecase } from "@/core/task/use-cases/task-update-results";
import { TaskUpdateStatusUsecase } from "@/core/task/use-cases/task-update-status";
import { RedisCacheModule } from "@/infra/cache/redis";
import { TaskSchema } from "@/infra/database/postgres/schemas/task";
import { ILoggerAdapter, LoggerModule } from "@/infra/logger";
import { TokenLibModule } from "@/libs/token";
import { AuthenticationMiddleware } from "@/middlewares/middlewares";

import {
	ITaskCreateAdapter,
	ITaskDeleteAdapter,
	ITaskFindByFlowAdapter,
	ITaskGetByIdAdapter,
	ITaskListAdapter,
	ITaskUpdateAdapter,
	ITaskUpdateResultsAdapter,
	ITaskUpdateStatusAdapter,
} from "./adapter";
import { TaskController } from "./controller";
import { TaskRepository } from "./repository";

@Module({
	imports: [
		TokenLibModule,
		LoggerModule,
		RedisCacheModule,
		TypeOrmModule.forFeature([TaskSchema]),
	],
	controllers: [TaskController],
	providers: [
		{
			provide: ITaskRepository,
			useFactory: (repository: Repository<TaskSchema & TaskEntity>) => {
				return new TaskRepository(repository);
			},
			inject: [getRepositoryToken(TaskSchema)],
		},
		{
			provide: ITaskCreateAdapter,
			useFactory: (
				taskRepository: ITaskRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new TaskCreateUsecase(taskRepository, loggerService);
			},
			inject: [ITaskRepository, ILoggerAdapter],
		},
		{
			provide: ITaskUpdateAdapter,
			useFactory: (
				taskRepository: ITaskRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new TaskUpdateUsecase(taskRepository, loggerService);
			},
			inject: [ITaskRepository, ILoggerAdapter],
		},
		{
			provide: ITaskListAdapter,
			useFactory: (taskRepository: ITaskRepository) => {
				return new TaskListUsecase(taskRepository);
			},
			inject: [ITaskRepository],
		},
		{
			provide: ITaskDeleteAdapter,
			useFactory: (
				taskRepository: ITaskRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new TaskDeleteUsecase(taskRepository, loggerService);
			},
			inject: [ITaskRepository, ILoggerAdapter],
		},
		{
			provide: ITaskGetByIdAdapter,
			useFactory: (taskRepository: ITaskRepository) => {
				return new TaskGetByIdUsecase(taskRepository);
			},
			inject: [ITaskRepository],
		},
		{
			provide: ITaskUpdateStatusAdapter,
			useFactory: (
				taskRepository: ITaskRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new TaskUpdateStatusUsecase(taskRepository, loggerService);
			},
			inject: [ITaskRepository, ILoggerAdapter],
		},
		{
			provide: ITaskUpdateResultsAdapter,
			useFactory: (
				taskRepository: ITaskRepository,
				loggerService: ILoggerAdapter,
			) => {
				return new TaskUpdateResultsUsecase(taskRepository, loggerService);
			},
			inject: [ITaskRepository, ILoggerAdapter],
		},
		{
			provide: ITaskFindByFlowAdapter,
			useFactory: (taskRepository: ITaskRepository) => {
				return new TaskFindByFlowUsecase(taskRepository);
			},
			inject: [ITaskRepository],
		},
	],
	exports: [
		ITaskRepository,
		ITaskCreateAdapter,
		ITaskUpdateAdapter,
		ITaskListAdapter,
		ITaskDeleteAdapter,
		ITaskGetByIdAdapter,
		ITaskUpdateStatusAdapter,
		ITaskUpdateResultsAdapter,
		ITaskFindByFlowAdapter,
	],
})
export class TaskModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(AuthenticationMiddleware).forRoutes(TaskController);
	}
}
