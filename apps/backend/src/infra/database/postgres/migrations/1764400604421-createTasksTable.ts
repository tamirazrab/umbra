import type { MigrationInterface, QueryRunner } from "typeorm";

export class createTasksTable1764400604421 implements MigrationInterface {
	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE IF NOT EXISTS "tasks" (
        "id" SERIAL PRIMARY KEY,
        "type" varchar(20) CHECK (type IN ('input', 'terminal', 'browser', 'code', 'ask', 'done')),
        "status" varchar(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'finished', 'stopped', 'failed')),
        "args" jsonb NOT NULL DEFAULT '{}',
        "results" text NOT NULL DEFAULT '{}',
        "message" text,
        "tool_call_id" varchar(255),
        "flow_id" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_tasks_flow" FOREIGN KEY ("flow_id") REFERENCES "flows"("id") ON DELETE CASCADE
      )`,
		);

		// Create indexes
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "IDX_tasks_flow_id" ON "tasks" ("flow_id")`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "IDX_tasks_status" ON "tasks" ("status")`,
		);
		await queryRunner.query(
			`CREATE INDEX IF NOT EXISTS "IDX_tasks_type" ON "tasks" ("type")`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_type"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_status"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tasks_flow_id"`);
		await queryRunner.dropTable("tasks", true);
	}
}
