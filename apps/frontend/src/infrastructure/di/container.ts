import {
  CreateFlowUseCase,
  CreateTaskUseCase,
  FinishFlowUseCase,
  GetCounterUseCase,
  GetFlowByIdUseCase,
  GetFlowsUseCase,
  GetTasksByFlowUseCase,
  IncrementCounterUseCase,
} from "@/core/application/use-cases";
import type {
  IGetCounterUseCase,
  IIncrementCounterUseCase,
} from "@/core/application/use-cases/counter";
import type {
  ICreateFlowUseCase,
  IFinishFlowUseCase,
  IGetFlowByIdUseCase,
  IGetFlowsUseCase,
} from "@/core/application/use-cases/flow";
import type {
  ICreateTaskUseCase,
  IGetTasksByFlowUseCase,
} from "@/core/application/use-cases/task";
import { CounterRepository, FlowRepository, TaskRepository } from "@/core/domain/repositories";
import { prisma } from "@/infrastructure/prisma/client";
import { PrismaCounterRepository, RestFlowRepository, RestTaskRepository } from "@/infrastructure/repositories";

export interface Dependencies {
  // Counter
  counterRepository: CounterRepository;
  getCounterUseCase: IGetCounterUseCase;
  incrementCounterUseCase: IIncrementCounterUseCase;
  // Flow
  flowRepository: FlowRepository;
  getFlowsUseCase: IGetFlowsUseCase;
  getFlowByIdUseCase: IGetFlowByIdUseCase;
  createFlowUseCase: ICreateFlowUseCase;
  finishFlowUseCase: IFinishFlowUseCase;
  // Task
  taskRepository: TaskRepository;
  createTaskUseCase: ICreateTaskUseCase;
  getTasksByFlowUseCase: IGetTasksByFlowUseCase;
}

class DIContainer {
  private dependencies: Dependencies;

  constructor() {
    // Infrastructure layer - Counter
    const counterRepository = new PrismaCounterRepository(prisma);

    // Infrastructure layer - Flow & Task (REST API)
    const flowRepository = new RestFlowRepository();
    const taskRepository = new RestTaskRepository();

    // Application layer - Counter
    const getCounterUseCase = new GetCounterUseCase(counterRepository);
    const incrementCounterUseCase = new IncrementCounterUseCase(counterRepository);

    // Application layer - Flow
    const getFlowsUseCase = new GetFlowsUseCase(flowRepository);
    const getFlowByIdUseCase = new GetFlowByIdUseCase(flowRepository);
    const createFlowUseCase = new CreateFlowUseCase(flowRepository);
    const finishFlowUseCase = new FinishFlowUseCase(flowRepository);

    // Application layer - Task
    const createTaskUseCase = new CreateTaskUseCase(taskRepository);
    const getTasksByFlowUseCase = new GetTasksByFlowUseCase(taskRepository);

    this.dependencies = {
      counterRepository,
      getCounterUseCase,
      incrementCounterUseCase,
      flowRepository,
      getFlowsUseCase,
      getFlowByIdUseCase,
      createFlowUseCase,
      finishFlowUseCase,
      taskRepository,
      createTaskUseCase,
      getTasksByFlowUseCase,
    };
  }

  getDependencies(): Dependencies {
    return this.dependencies;
  }

  // Counter accessors
  getCounterRepository(): CounterRepository {
    return this.dependencies.counterRepository;
  }

  getCounterUseCase(): IGetCounterUseCase {
    return this.dependencies.getCounterUseCase;
  }

  getIncrementCounterUseCase(): IIncrementCounterUseCase {
    return this.dependencies.incrementCounterUseCase;
  }

  // Flow accessors
  getFlowRepository(): FlowRepository {
    return this.dependencies.flowRepository;
  }

  getGetFlowsUseCase(): IGetFlowsUseCase {
    return this.dependencies.getFlowsUseCase;
  }

  getGetFlowByIdUseCase(): IGetFlowByIdUseCase {
    return this.dependencies.getFlowByIdUseCase;
  }

  getCreateFlowUseCase(): ICreateFlowUseCase {
    return this.dependencies.createFlowUseCase;
  }

  getFinishFlowUseCase(): IFinishFlowUseCase {
    return this.dependencies.finishFlowUseCase;
  }

  // Task accessors
  getTaskRepository(): TaskRepository {
    return this.dependencies.taskRepository;
  }

  getCreateTaskUseCase(): ICreateTaskUseCase {
    return this.dependencies.createTaskUseCase;
  }

  getGetTasksByFlowUseCase(): IGetTasksByFlowUseCase {
    return this.dependencies.getTasksByFlowUseCase;
  }
}

export const container = new DIContainer();
