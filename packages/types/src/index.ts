// =============================================================================
// Flow Types
// =============================================================================

export enum FlowStatus {
  InProgress = "inProgress",
  Finished = "finished",
}

export interface Model {
  id: string;
  provider: string;
}

export interface Browser {
  url: string;
  screenshotUrl: string;
}

export interface Terminal {
  containerName: string;
  connected: boolean;
  logs: Log[];
}

export interface Flow {
  id: number;
  name: string;
  status: FlowStatus;
  model: Model;
  tasks: Task[];
  terminal: Terminal;
  browser: Browser;
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowOverview {
  id: number;
  name: string;
  status: FlowStatus;
}

export interface CreateFlowInput {
  modelProvider: string;
  modelId: string;
}

// =============================================================================
// Task Types
// =============================================================================

export enum TaskStatus {
  InProgress = "inProgress",
  Finished = "finished",
  Failed = "failed",
  Stopped = "stopped",
}

export enum TaskType {
  Ask = "ask",
  Browser = "browser",
  Code = "code",
  Done = "done",
  Input = "input",
  Terminal = "terminal",
}

export interface Task {
  id: number;
  type: TaskType;
  message: string;
  status: TaskStatus;
  args: Record<string, unknown>;
  results: Record<string, unknown>;
  createdAt: string;
  flowId?: number;
}

export interface CreateTaskInput {
  flowId: number;
  query: string;
}

// =============================================================================
// Log Types
// =============================================================================

export interface Log {
  id: number;
  text: string;
}

// =============================================================================
// Socket.IO Event Types
// =============================================================================

export interface TerminalOutputEvent {
  text: string;
  isInput: boolean;
}

export interface FlowUpdateEvent {
  status: FlowStatus;
}

export interface TaskUpdateEvent {
  taskId: number;
}

// =============================================================================
// Event Names
// =============================================================================

export enum EventName {
  SendEmail = "send-email",
  TerminalOutput = "terminal.output",
  FlowUpdate = "flow.update",
  TaskUpdate = "task.update",
}
