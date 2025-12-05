import { Injectable } from "@nestjs/common";
import type { MongooseModuleOptions } from "@nestjs/mongoose";

import type { IDataBaseAdapter } from "../adapter";
import type { ConnectionType } from "../types";

@Injectable()
export class MongoService implements Partial<IDataBaseAdapter> {
	getConnection<TOpt = MongooseModuleOptions>({ URI }: ConnectionType): TOpt {
		return {
			uri: URI,
		} as TOpt;
	}
}
