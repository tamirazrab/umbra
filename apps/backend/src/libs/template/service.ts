import { Injectable } from "@nestjs/common";
import Handlebars from "handlebars";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { ITemplateService } from "./adapter";

@Injectable()
export class TemplateService implements ITemplateService {
	private readonly templatesPath = join(__dirname, ".");
	private readonly promptsPath = join(this.templatesPath, "prompts");
	private readonly scriptsPath = join(this.templatesPath, "scripts");

	constructor() {
		Handlebars.registerHelper("json", (context) => JSON.stringify(context));
	}

	async renderPrompt(
		templateName: string,
		data: Record<string, unknown>,
	): Promise<string> {
		const templatePath = join(this.promptsPath, `${templateName}.hbs`);
		const templateContent = await readFile(templatePath, "utf-8");
		const template = Handlebars.compile(templateContent);
		return template(data);
	}

	async getScript(scriptName: string): Promise<string> {
		const scriptPath = join(this.scriptsPath, `${scriptName}.js`);
		return await readFile(scriptPath, "utf-8");
	}
}
