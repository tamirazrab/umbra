import type { MigrationInterface, QueryRunner } from "typeorm";

export class createFlowsTable1764398533283 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE IF NOT EXISTS "flows" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar(255),
        "status" varchar(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'finished')),
        "model" varchar(255),
        "model_provider" varchar(255),
        "container_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_flows_container" FOREIGN KEY ("container_id") REFERENCES "containers"("id") ON DELETE SET NULL
      )`,
		);

		// Create indexes for faster queries
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "IDX_flows_status" ON "flows" ("status")`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "IDX_flows_container_id" ON "flows" ("container_id")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_flows_container_id"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_flows_status"`);
		await queryRunner.dropTable("flows", true);
	}
}
