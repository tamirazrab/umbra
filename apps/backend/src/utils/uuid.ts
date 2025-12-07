import {
	validate as uuidValidate,
	version as uuidVersion,
	v4 as uuidv4,
} from "uuid";

export class UUIDUtils {
	static create(): string {
		return uuidv4();
	}

	static isUUID(uuid: string): boolean {
		return uuidValidate(uuid) && uuidVersion(uuid) === 4;
	}
}
