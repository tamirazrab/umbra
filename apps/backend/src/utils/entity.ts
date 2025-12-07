import type z from "zod";
import { DateUtils } from "./date";
import { UUIDUtils } from "./uuid";

export const withID = (entity: { _id?: string; id?: string }) => {
	const id = entity.id || entity._id || UUIDUtils.create();
	return Object.assign(entity, { id });
};

export interface IEntity {
	id: string;
	createdAt?: Date | null;
	updatedAt?: Date | null;
	deletedAt?: Date | null;
}

export const BaseEntity = <T>() => {
	abstract class Entity implements IEntity {
		schema: z.ZodSchema;
		id!: string;
		readonly createdAt?: Date | null;
		readonly updatedAt?: Date | null;
		deletedAt?: Date | null;

		constructor(schema: z.ZodSchema) {
			this.schema = schema;
		}

		static nameOf = <D = keyof T>(name: keyof T) => name as D;

		deactivated() {
			this.deletedAt = DateUtils.getJSDate();
		}

		activated() {
			this.deletedAt = null;
		}

		validate(entity: T): T {
			const prepared = withID(entity as IEntity);
			this.id = prepared.id;
			return this.schema.parse(prepared) as T;
		}
	}

	return Entity;
};
