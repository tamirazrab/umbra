import type {
  FlowStatus,
  FlowUpdateEvent,
  Log,
  TaskUpdateEvent,
  TerminalOutputEvent,
} from "@/core/domain/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// =============================================================================
// Socket.IO Configuration
// =============================================================================

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// =============================================================================
// Socket.IO Service Class
// =============================================================================

class SocketService {
  private socket: Socket | null = null;
  private flowId: number | null = null;

  connect(flowId: number): Socket {
    // Disconnect existing connection if different flow
    if (this.socket && this.flowId !== flowId) {
      this.disconnect();
    }

    // Return existing connection for same flow
    if (this.socket && this.flowId === flowId) {
      return this.socket;
    }

    this.flowId = flowId;
    this.socket = io(`${SOCKET_URL}/terminal`, {
      query: { flowId: flowId.toString() },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      console.log(`[Socket] Connected to flow ${flowId}`);
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected from flow ${flowId}: ${reason}`);
    });

    this.socket.on("connect_error", (error) => {
      console.error(`[Socket] Connection error:`, error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.flowId = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  sendTerminalInput(flowId: number, input: string): void {
    if (this.socket) {
      this.socket.emit("terminal_input", { flowId, input });
    }
  }
}

// Singleton instance
export const socketService = new SocketService();

// =============================================================================
// React Hooks for Real-time Updates
// =============================================================================

/**
 * Hook for subscribing to terminal output events
 */
export function useTerminalOutput(flowId: number | null) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const logIdRef = useRef(0);

  useEffect(() => {
    if (!flowId) return;

    const socket = socketService.connect(flowId);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    const handleTerminalOutput = (data: TerminalOutputEvent) => {
      logIdRef.current += 1;
      setLogs((prev) => [
        ...prev,
        {
          id: logIdRef.current,
          text: data.text,
        },
      ]);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("terminal_output", handleTerminalOutput);

    // Check if already connected
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("terminal_output", handleTerminalOutput);
    };
  }, [flowId]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    logIdRef.current = 0;
  }, []);

  const sendInput = useCallback(
    (input: string) => {
      if (flowId) {
        socketService.sendTerminalInput(flowId, input);
      }
    },
    [flowId]
  );

  return { logs, isConnected, clearLogs, sendInput };
}

/**
 * Hook for subscribing to flow update events
 */
export function useFlowUpdate(
  flowId: number | null,
  onUpdate?: (status: FlowStatus) => void
) {
  const [status, setStatus] = useState<FlowStatus | null>(null);

  useEffect(() => {
    if (!flowId) return;

    const socket = socketService.connect(flowId);

    const handleFlowUpdate = (data: FlowUpdateEvent) => {
      setStatus(data.status);
      onUpdate?.(data.status);
    };

    socket.on("flow_update", handleFlowUpdate);

    return () => {
      socket.off("flow_update", handleFlowUpdate);
    };
  }, [flowId, onUpdate]);

  return { status };
}

/**
 * Hook for subscribing to task update events
 */
export function useTaskUpdate(
  flowId: number | null,
  onTaskUpdate?: (taskId: number) => void
) {
  const [lastUpdatedTaskId, setLastUpdatedTaskId] = useState<number | null>(null);

  useEffect(() => {
    if (!flowId) return;

    const socket = socketService.connect(flowId);

    const handleTaskUpdate = (data: TaskUpdateEvent) => {
      setLastUpdatedTaskId(data.taskId);
      onTaskUpdate?.(data.taskId);
    };

    socket.on("task_update", handleTaskUpdate);

    return () => {
      socket.off("task_update", handleTaskUpdate);
    };
  }, [flowId, onTaskUpdate]);

  return { lastUpdatedTaskId };
}

/**
 * Combined hook for all real-time flow updates
 */
export function useFlowRealtime(flowId: number | null) {
  const terminalOutput = useTerminalOutput(flowId);
  const flowUpdate = useFlowUpdate(flowId);
  const taskUpdate = useTaskUpdate(flowId);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flowId) {
        socketService.disconnect();
      }
    };
  }, [flowId]);

  return {
    terminal: terminalOutput,
    flow: flowUpdate,
    task: taskUpdate,
    isConnected: terminalOutput.isConnected,
  };
}
