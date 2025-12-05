import type { MigrationInterface } from "mongo-migrate-ts";
import type { Db } from "mongodb";

export class CreateUserCollection1709943706267 implements MigrationInterface {
	async up(db: Db): Promise<void> {
		await db.createCollection("cats");
	}

	async down(db: Db): Promise<void> {
		await db.dropCollection("cats");
	}
}
