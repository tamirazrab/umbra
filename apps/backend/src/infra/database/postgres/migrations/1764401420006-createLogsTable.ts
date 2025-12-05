import type { MigrationInterface, QueryRunner } from "typeorm";

export class createLogsTable1764401420006 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE IF NOT EXISTS "logs" (
        "id" SERIAL PRIMARY KEY,
        "message" text NOT NULL,
        "type" varchar(20) NOT NULL CHECK (type IN ('input', 'output')),
        "flow_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_logs_flow" FOREIGN KEY ("flow_id") REFERENCES "flows"("id") ON DELETE CASCADE
      )`,
		);

		// Create indexes
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "IDX_logs_flow_id" ON "logs" ("flow_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "IDX_logs_type" ON "logs" ("type")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_logs_type"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_logs_flow_id"`);
		await queryRunner.dropTable("logs", true);
	}
}
