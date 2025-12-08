import { Module } from "@nestjs/common";

import { TerminalGateway } from "./gateway";

@Module({
	providers: [TerminalGateway],
	exports: [TerminalGateway],
})
export class WebSocketModule {}
