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

import { ContainerSchema } from "./container";

@Entity({ name: "flows" })
export class FlowSchema extends BaseEntity {
	@PrimaryGeneratedColumn("increment")
	id!: number;

	@Column({ type: "varchar", length: 255, nullable: true })
	name!: string | null;

	@Column({
		type: "enum",
		enum: ["in_progress", "finished"],
		default: "in_progress",
	})
	status!: string;

	@Column({ type: "varchar", length: 255, nullable: true })
	model!: string | null;

	@Column({
		name: "model_provider",
		type: "varchar",
		length: 255,
		nullable: true,
	})
	modelProvider!: string | null;

	@Column({ name: "container_id", type: "integer", nullable: true })
	containerId!: number | null;

	@ManyToOne(() => ContainerSchema, { nullable: true })
	@JoinColumn({ name: "container_id" })
	container!: ContainerSchema | null;

	@CreateDateColumn({ name: "created_at" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt!: Date;
}
