import { Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
	ConnectedSocket,
	MessageBody,
	type OnGatewayConnection,
	type OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";

import { EventNameEnum } from "@/libs/event/types";

@WebSocketGateway({
	cors: {
		origin: "*",
		credentials: true,
	},
	namespace: "/terminal",
})
export class TerminalGateway
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer()
	server!: Server;

	private readonly logger = new Logger(TerminalGateway.name);
	private connections: Map<string, Socket> = new Map();

	handleConnection(client: Socket): void {
		const flowId = client.handshake.query.flowId as string;
		if (!flowId) {
			this.logger.warn("Client connected without flowId");
			client.disconnect();
			return;
		}

		this.logger.log(`Client connected to flow ${flowId}: ${client.id}`);
		this.connections.set(flowId, client);

		// Join room for this flow
		client.join(`flow-${flowId}`);
	}

	handleDisconnect(client: Socket): void {
		const flowId = client.handshake.query.flowId as string;
		this.logger.log(`Client disconnected from flow ${flowId}: ${client.id}`);

		if (flowId) {
			this.connections.delete(flowId);
			client.leave(`flow-${flowId}`);
		}
	}

	@OnEvent(EventNameEnum.TERMINAL_OUTPUT)
	handleTerminalOutput(payload: { flowId: number; content: string }): void {
		this.server.to(`flow-${payload.flowId}`).emit("terminal_output", {
			text: this.formatTerminalOutput(payload.content),
			isInput: false,
		});
	}

	@OnEvent(EventNameEnum.FLOW_UPDATE)
	handleFlowUpdate(payload: { flowId: number; status: string }): void {
		this.server
			.to(`flow-${payload.flowId}`)
			.emit("flow_update", { status: payload.status });
	}

	@OnEvent(EventNameEnum.TASK_UPDATE)
	handleTaskUpdate(payload: { flowId: number; taskId: number }): void {
		// We emit the task ID and let the client fetch the full task if needed
		this.server
			.to(`flow-${payload.flowId}`)
			.emit("task_update", { taskId: payload.taskId });
	}

	@SubscribeMessage("terminal_input")
	handleTerminalInput(
		@ConnectedSocket() _client: Socket,
		@MessageBody() data: { flowId: number; input: string },
	): { success: boolean } {
		const { flowId, input } = data;
		this.logger.log(`Terminal input for flow ${flowId}: ${input}`);

		// Echo the input back with formatting
		this.server.to(`flow-${flowId}`).emit("terminal_output", {
			text: this.formatTerminalInput(input),
			isInput: true,
		});

		// Emit input received event
		this.server.to(`flow-${flowId}`).emit("input_received", { input });

		return { success: true };
	}

	private formatTerminalInput(text: string): string {
		const yellow = "\\u001b[33m";
		const reset = "\\u001b[0m";
		return `$ ${yellow}${text}${reset}\\r\\n`;
	}

	private formatTerminalOutput(text: string): string {
		return `${text}\\r\\n`;
	}
}
