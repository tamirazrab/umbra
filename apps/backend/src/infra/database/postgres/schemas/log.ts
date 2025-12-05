import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from "typeorm";

import { LogType } from "@/core/log/entity/log";
import { FlowSchema } from "@/infra/database/postgres/schemas/flow";

@Entity({ name: "logs" })
export class LogSchema extends BaseEntity {
	@PrimaryGeneratedColumn("increment")
	id!: number;

	@Column({ type: "text" })
	message!: string;

	@Column({
		type: "enum",
		enum: LogType,
	})
	type!: LogType;

	@CreateDateColumn({ name: "created_at" })
	createdAt!: Date;

	@Column({ name: "flow_id", nullable: true })
	flowId!: number | null;

	@ManyToOne(() => FlowSchema, { nullable: true, onDelete: "CASCADE" })
	@JoinColumn({ name: "flow_id" })
	flow!: FlowSchema | null;
}
