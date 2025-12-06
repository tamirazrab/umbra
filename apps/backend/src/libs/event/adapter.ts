import type { EmitEventOutput } from "./service";
import type { EventNameEnum } from "./types";

export abstract class IEventAdapter {
	abstract emit<T>(event: EventNameEnum, payload: T): EmitEventOutput;
}
