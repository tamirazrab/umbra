import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

import { FlowSchema } from "./flow";

@Entity({ name: "tasks" })
export class TaskSchema extends BaseEntity {
	@PrimaryGeneratedColumn("increment")
	id!: number;

	@Column({
		type: "enum",
		enum: ["input", "terminal", "browser", "code", "ask", "done"],
		nullable: true,
	})
	type!: string | null;

	@Column({
		type: "enum",
		enum: ["in_progress", "finished", "stopped", "failed"],
		default: "in_progress",
	})
	status!: string;

	@Column({ type: "jsonb", default: {} })
	args!: Record<string, unknown>;

	@Column({ type: "text", default: "{}" })
	results!: string;

	@Column({ type: "text", nullable: true })
	message!: string | null;

	@Column({
		name: "tool_call_id",
		type: "varchar",
		length: 255,
		nullable: true,
	})
	toolCallId!: string | null;

	@Column({ name: "flow_id", type: "integer", nullable: true })
	flowId!: number | null;

	@ManyToOne(() => FlowSchema, { nullable: true, onDelete: "CASCADE" })
	@JoinColumn({ name: "flow_id" })
	flow!: FlowSchema | null;

	@CreateDateColumn({ name: "created_at" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt!: Date;
}
