import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { LogEntity, LogType } from "@/core/log/entity/log";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { LogCreateUsecase } from "@/core/log/use-cases/log-create";
// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { IEventAdapter } from "@/libs/event/adapter";
import { EventNameEnum } from "@/libs/event/types";
import { mockFn, mockResolvedValue, mockTracing } from "../../../../test/mock";

// biome-ignore lint/style/useImportType: used as Nest DI tokens
import { DockerService } from "../docker.service";
import { TerminalService } from "../terminal.service";

describe(TerminalService.name, () => {
	let service: TerminalService;
	let dockerService: DockerService;
	let logCreateUsecase: LogCreateUsecase;
	let eventService: IEventAdapter;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			providers: [
				TerminalService,
				{
					provide: DockerService,
					useValue: {
						isContainerRunning: mockFn(),
						execCommand: mockFn(),
						writeFile: mockFn(),
						readFile: mockFn(),
					},
				},
				{
					provide: LogCreateUsecase,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: IEventAdapter,
					useValue: {
						emit: mockFn(),
					},
				},
			],
		}).compile();

		service = app.get(TerminalService);
		dockerService = app.get(DockerService);
		logCreateUsecase = app.get(LogCreateUsecase);
		eventService = app.get(IEventAdapter);
	});

	test("should be defined", () => {
		expect(service).toBeDefined();
	});

	describe("terminalName", () => {
		test("should generate correct terminal name", () => {
			const flowId = 123;
			const name = service.terminalName(flowId);

			expect(name).toBe("codel-terminal-123");
		});
	});

	describe("execCommand", () => {
		test("should execute command successfully", async () => {
			const flowId = 123;
			const command = "ls -la";
			const output = "file1.txt\nfile2.txt";

			(dockerService.isContainerRunning as ReturnType<typeof mockFn>).mockResolvedValue(true);
			(dockerService.execCommand as ReturnType<typeof mockFn>).mockResolvedValue(output);

			const result = await service.execCommand(flowId, command, mockTracing());

			expect(result).toBe(output);
			expect(dockerService.isContainerRunning).toHaveBeenCalledWith(
				"codel-terminal-123",
			);
			expect(dockerService.execCommand).toHaveBeenCalledWith(
				flowId,
				"codel-terminal-123",
				command,
				mockTracing(),
			);
		});

		test("should throw error if container is not running", async () => {
			(dockerService.isContainerRunning as ReturnType<typeof mockFn>).mockResolvedValue(false);

			await expect(service.execCommand(123, "ls", mockTracing())).rejects.toThrow(
				"Container is not running",
			);
		});

		test("should handle command execution error", async () => {
			(dockerService.isContainerRunning as ReturnType<typeof mockFn>).mockResolvedValue(true);
			(dockerService.execCommand as ReturnType<typeof mockFn>).mockRejectedValue(
				new Error("Command failed"),
			);

			await expect(service.execCommand(123, "invalid-command", mockTracing())).rejects.toThrow(
				"Command failed",
			);
		});
	});

	describe("writeFile", () => {
		test("should write file successfully", async () => {
			const flowId = 123;
			const content = "file content";
			const filePath = "/path/to/file.txt";

			(dockerService.isContainerRunning as ReturnType<typeof mockFn>).mockResolvedValue(true);
			(dockerService.writeFile as ReturnType<typeof mockFn>).mockResolvedValue(undefined);

			await service.writeFile(flowId, content, filePath, mockTracing());

			expect(dockerService.isContainerRunning).toHaveBeenCalledWith(
				"codel-terminal-123",
			);
			expect(dockerService.writeFile).toHaveBeenCalledWith(
				flowId,
				"codel-terminal-123",
				content,
				filePath,
				mockTracing(),
			);
		});

		test("should throw error if container is not running", async () => {
			(dockerService.isContainerRunning as ReturnType<typeof mockFn>).mockResolvedValue(false);

			await expect(
				service.writeFile(123, "content", "/path/to/file", mockTracing()),
			).rejects.toThrow("Container is not running");
		});
	});

	describe("readFile", () => {
		test("should read file successfully", async () => {
			const flowId = 123;
			const filePath = "/path/to/file.txt";
			const expectedContent = "file content";

			(dockerService.isContainerRunning as ReturnType<typeof mockFn>).mockResolvedValue(true);
			(dockerService.readFile as ReturnType<typeof mockFn>).mockResolvedValue(expectedContent);

			const result = await service.readFile(flowId, filePath, mockTracing());

			expect(dockerService.readFile).toHaveBeenCalledWith(
				flowId,
				"codel-terminal-123",
				filePath,
				mockTracing(),
			);
			expect(result).toBe(expectedContent);
		});
	});
});
