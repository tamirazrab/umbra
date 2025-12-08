import { Test } from "@nestjs/testing";
import {
	getUUID,
	mockFn,
	mockResolvedValue,
	mockTracing,
	mockUser,
} from "test/mock";
import { beforeEach, describe, expect, test } from "vitest";

import { FlowEntity, FlowStatus } from "@/core/flow/entity/flow";

import {
	IFlowCreateAdapter,
	IFlowDeleteAdapter,
	IFlowFinishAdapter,
	IFlowGetByIdAdapter,
	IFlowListAdapter,
	IFlowUpdateAdapter,
	IFlowUpdateStatusAdapter,
} from "../adapter";
import { FlowController } from "../controller";

describe(FlowController.name, () => {
	let controller: FlowController;
	let createUsecase: IFlowCreateAdapter;
	let updateUsecase: IFlowUpdateAdapter;
	let deleteUsecase: IFlowDeleteAdapter;
	let listUsecase: IFlowListAdapter;
	let getByIdUsecase: IFlowGetByIdAdapter;
	let updateStatusUsecase: IFlowUpdateStatusAdapter;
	let finishUsecase: IFlowFinishAdapter;

	beforeEach(async () => {
		const app = await Test.createTestingModule({
			controllers: [FlowController],
			providers: [
				{
					provide: IFlowCreateAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: IFlowUpdateAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: IFlowDeleteAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: IFlowListAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: IFlowGetByIdAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: IFlowUpdateStatusAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
				{
					provide: IFlowFinishAdapter,
					useValue: {
						execute: mockFn(),
					},
				},
			],
		}).compile();

		controller = app.get<FlowController>(FlowController);
		createUsecase = app.get(IFlowCreateAdapter);
		updateUsecase = app.get(IFlowUpdateAdapter);
		deleteUsecase = app.get(IFlowDeleteAdapter);
		listUsecase = app.get(IFlowListAdapter);
		getByIdUsecase = app.get(IFlowGetByIdAdapter);
		updateStatusUsecase = app.get(IFlowUpdateStatusAdapter);
		finishUsecase = app.get(IFlowFinishAdapter);
	});

	test("should be defined", () => {
		expect(controller).toBeDefined();
	});

	describe("create", () => {
		test("should create a flow", async () => {
			const flow = new FlowEntity({
				id: getUUID(),
				name: "Test Flow",
				status: FlowStatus.IN_PROGRESS,
				model: "gpt-4",
				modelProvider: "openai",
				containerId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			createUsecase.execute = mockResolvedValue<any>(flow);

			const req = {
				body: {
					name: "Test Flow",
					model: "gpt-4",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			const result = await controller.create(req);

			expect(result).toEqual(flow);
			expect(createUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("update", () => {
		test("should update a flow", async () => {
			const flow = new FlowEntity({
				id: getUUID(),
				name: "Updated Flow",
				status: FlowStatus.IN_PROGRESS,
				model: "gpt-4",
				modelProvider: "openai",
				containerId: 1,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			updateUsecase.execute = mockResolvedValue<any>(flow);

			const req = {
				body: {
					name: "Updated Flow",
				},
				params: {
					id: "1",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			const result = await controller.update(req);

			expect(result).toEqual(flow);
			expect(updateUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("list", () => {
		test("should return paginated flows", async () => {
			const paginationOutput = {
				docs: [],
				total: 0,
				page: 1,
				limit: 10,
			};

			listUsecase.execute = mockResolvedValue<any>(paginationOutput);

			const req = {
				query: {
					page: "1",
					limit: "10",
				},
			} as any;

			const result = await controller.list(req);

			expect(result).toEqual(paginationOutput);
			expect(listUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("getById", () => {
		test("should get flow by id", async () => {
			const flow = new FlowEntity({
				id: getUUID(),
				name: "Test Flow",
				status: FlowStatus.IN_PROGRESS,
				model: null,
				modelProvider: null,
				containerId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			getByIdUsecase.execute = mockResolvedValue<any>(flow);

			const req = {
				params: {
					id: "1",
				},
			} as any;

			const result = await controller.getById(req);

			expect(result).toEqual(flow);
			expect(getByIdUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("delete", () => {
		test("should delete a flow", async () => {
			deleteUsecase.execute = mockResolvedValue<any>(undefined);

			const req = {
				params: {
					id: "1",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			await controller.delete(req);

			expect(deleteUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("updateStatus", () => {
		test("should update flow status", async () => {
			const flow = new FlowEntity({
				id: getUUID(),
				name: "Test Flow",
				status: FlowStatus.FINISHED,
				model: null,
				modelProvider: null,
				containerId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			updateStatusUsecase.execute = mockResolvedValue<any>(flow);

			const req = {
				body: {
					status: FlowStatus.FINISHED,
				},
				params: {
					id: "1",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			const result = await controller.updateStatus(req);

			expect(result).toEqual(flow);
			expect(updateStatusUsecase.execute).toHaveBeenCalled();
		});
	});

	describe("finish", () => {
		test("should finish a flow", async () => {
			const flow = new FlowEntity({
				id: getUUID(),
				name: "Test Flow",
				status: FlowStatus.FINISHED,
				model: null,
				modelProvider: null,
				containerId: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			finishUsecase.execute = mockResolvedValue<any>(flow);

			const req = {
				params: {
					id: "1",
				},
				user: mockUser(),
				tracing: mockTracing().tracing,
			} as any;

			const result = await controller.finish(req);

			expect(result).toEqual(flow);
			expect(finishUsecase.execute).toHaveBeenCalled();
		});
	});
});
