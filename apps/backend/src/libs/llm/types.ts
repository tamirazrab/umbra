import type { TaskEntity } from "@/core/task/entity/task";
import { Task } from "@umbra/types";

export interface NextTaskOptions {
	tasks: TaskEntity[];
	dockerImage: string;
}
