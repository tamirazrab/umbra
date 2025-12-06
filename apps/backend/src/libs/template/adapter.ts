export abstract class ITemplateService {
	abstract renderPrompt(
		templateName: string,
		data: Record<string, unknown>,
	): Promise<string>;
	abstract getScript(scriptName: string): Promise<string>;
}
