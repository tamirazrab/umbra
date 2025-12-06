import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test } from "vitest";

import { ITemplateService } from "../adapter";
import { TemplateService } from "../service";

describe(TemplateService.name, () => {
	let service: ITemplateService;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			providers: [
				{
					provide: ITemplateService,
					useClass: TemplateService,
				},
			],
		}).compile();

		service = app.get(ITemplateService);
	});

	describe("renderPrompt", () => {
		test("should render agent prompt with variables", async () => {
			const result = await service.renderPrompt("agent", {
				dockerImage: "node:latest",
				toolPlaceholder: "Custom tools here",
				tasks: [
					{
						id: 1,
						type: "terminal",
						args: { command: "ls -la" },
						results: "Success",
						message: "Listing files",
					},
				],
			});

			expect(result).toContain("node:latest");
			expect(result).toContain("Custom tools here");
			expect(result).toContain('"id": 1');
			expect(result).toContain('"type": "terminal"');
		});

		test("should render docker prompt with task", async () => {
			const result = await service.renderPrompt("docker", {
				task: "Build a React application",
			});

			expect(result).toContain("Build a React application");
			expect(result).toContain("docker image");
		});

		test("should render summary prompt with text and length", async () => {
			const result = await service.renderPrompt("summary", {
				n: 100,
				text: "This is a long text that needs to be summarized...",
			});

			expect(result).toContain("100");
			expect(result).toContain(
				"This is a long text that needs to be summarized...",
			);
		});

		test("should throw error for non-existent template", async () => {
			await expect(service.renderPrompt("non-existent", {})).rejects.toThrow();
		});
	});

	describe("getScript", () => {
		test("should return content script", async () => {
			const script = await service.getScript("content");

			expect(script).toContain("textNodesUnder");
			expect(script).toContain("document.body");
			expect(script).toContain("SCRIPT");
		});

		test("should return urls script", async () => {
			const script = await service.getScript("urls");

			expect(script).toContain("extractUrlsFromLinks");
			expect(script).toContain("extractUrlsFromAttributes");
			expect(script).toContain("getElementsByTagName");
		});

		test("should throw error for non-existent script", async () => {
			await expect(service.getScript("non-existent")).rejects.toThrow();
		});
	});
});
