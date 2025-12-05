import { Injectable } from "@nestjs/common";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";

import { name } from "../../../../package.json";

import type { IDataBaseAdapter } from "../adapter";
import type { ConnectionType } from "../types";

@Injectable()
export class PostgresService implements Partial<IDataBaseAdapter> {
	getConnection<TOpt = TypeOrmModuleOptions & { url: string }>({
		URI,
	}: ConnectionType): TOpt {
		return {
			type: "postgres",
			url: URI,
			database: name,
		} as TOpt;
	}
}
