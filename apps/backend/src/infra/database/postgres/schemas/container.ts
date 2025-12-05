import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";

@Entity({ name: "containers" })
export class ContainerSchema extends BaseEntity {
	@PrimaryGeneratedColumn("increment")
	id!: number;

	@Column({ type: "varchar", length: 255, nullable: true })
	name!: string | null;

	@Column({ name: "local_id", type: "varchar", length: 255, nullable: true })
	localId!: string | null;

	@Column({ type: "varchar", length: 255, nullable: true })
	image!: string | null;

	@Column({
		type: "enum",
		enum: ["starting", "running", "stopped", "failed"],
		default: "starting",
	})
	status!: string;

	@CreateDateColumn({ name: "created_at" })
	createdAt!: Date;

	@UpdateDateColumn({ name: "updated_at" })
	updatedAt!: Date;
}
