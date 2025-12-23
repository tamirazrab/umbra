import type { TaskEntity } from "@/core/task/entity/task";

export interface NextTaskOptions {
	tasks: TaskEntity[];
	dockerImage: string;
}
