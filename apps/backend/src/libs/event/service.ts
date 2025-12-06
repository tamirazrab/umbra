import { Injectable } from "@nestjs/common";
import type { EventEmitter2 } from "@nestjs/event-emitter";

import type { IEventAdapter } from "./adapter";

@Injectable()
export class EventService implements IEventAdapter {
	constructor(private eventEmitter: EventEmitter2) {}

	emit<T>(event: string, payload: T): EmitEventOutput {
		const eventEmitter = this.eventEmitter.emit(event, payload);

		return eventEmitter;
	}
}

export type EmitEventInput<T> = T;
export type EmitEventOutput = boolean;
