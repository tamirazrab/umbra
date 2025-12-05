import type { MigrationInterface, QueryRunner } from "typeorm";

export class createContainersTable1764398106083 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE IF NOT EXISTS "containers" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(255),
        "local_id" varchar(255),
        "image" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'starting' CHECK (status IN ('starting', 'running', 'stopped', 'failed')),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )`,
		);

		// Create index on status for faster queries
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "IDX_containers_status" ON "containers" ("status")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_containers_status"`);
		await queryRunner.dropTable("containers", true);
	}
}
