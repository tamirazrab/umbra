import { BrowserPreview, Panel, Sidebar, Terminal } from "@/components/features";
import type { Model } from "@/core/domain/types";
import { useCreateFlow, useCreateTask, useFinishFlow, useFlow } from "@/hooks";
import { useFlowRealtime } from "@/infrastructure/socket";
import { cn } from "@/lib/utils";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Send, Square } from "lucide-react";
import { useCallback, useState } from "react";

export const Route = createFileRoute("/chat/$id")({
  component: ChatPage,
});

function ChatPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const isNewFlow = !id || id === "new";
  const flowId = isNewFlow ? null : Number(id);

  // State
  const [message, setMessage] = useState("");
  const [selectedModel] = useState<Model>({ id: "gpt-4", provider: "openai" });
  const [activeTab, setActiveTab] = useState<"terminal" | "browser">("terminal");

  // Queries and mutations
  const { data: flow, isLoading: flowLoading } = useFlow(flowId);
  const { mutateAsync: createFlow, isPending: isCreatingFlow } = useCreateFlow();
  const { mutateAsync: finishFlow, isPending: isFinishingFlow } = useFinishFlow();
  const { mutateAsync: createTask, isPending: isCreatingTask } = useCreateTask();

  // Real-time updates
  const realtime = useFlowRealtime(flowId);

  // Handlers
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const currentMessage = message;
    setMessage("");

    if (isNewFlow) {
      // Create new flow first
      const newFlow = await createFlow({
        modelProvider: selectedModel.provider,
        modelId: selectedModel.id,
      });

      // Navigate to new flow
      navigate({ to: "/chat/$id", params: { id: newFlow.id.toString() } });

      // Create task in the new flow
      await createTask({
        flowId: Number(newFlow.id),
        query: currentMessage,
      });
    } else {
      // Create task in existing flow
      await createTask({
        flowId: flowId!,
        query: currentMessage,
      });
    }
  }, [message, isNewFlow, flowId, createFlow, createTask, navigate, selectedModel]);

  const handleStop = useCallback(async () => {
    if (flowId) {
      await finishFlow(flowId);
    }
  }, [flowId, finishFlow]);

  const isSubmitting = isCreatingFlow || isCreatingTask;
  const canStop = flow?.status === "inProgress" && !isFinishingFlow;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">
            {isNewFlow ? "New Chat" : flow?.name || `Chat ${id}`}
          </h2>
          {flow?.model && (
            <span className="text-sm text-muted-foreground">
              {flow.model.provider} / {flow.model.id}
            </span>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Left Panel - Messages/Tasks */}
          <Panel className="flex-1">
            <div className="flex-1 overflow-auto space-y-4 mb-4">
              {flowLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : flow?.tasks?.length ? (
                flow.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "p-4 rounded-lg",
                      task.type === "input" || task.type === "ask"
                        ? "bg-primary/10 ml-12"
                        : "bg-muted mr-12"
                    )}
                  >
                    <div className="text-xs text-muted-foreground mb-1 uppercase">
                      {task.type}
                    </div>
                    <div className="text-sm">{task.message}</div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <div className="text-4xl mb-4">👋</div>
                  <p className="text-lg font-medium">Start a conversation</p>
                  <p className="text-sm">Type a message below to begin</p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={isSubmitting}
              />
              {canStop && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
                  disabled={isFinishingFlow}
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </Panel>

          {/* Right Panel - Terminal/Browser */}
          <Panel className="flex-1">
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab("terminal")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === "terminal"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Terminal
              </button>
              <button
                onClick={() => setActiveTab("browser")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  activeTab === "browser"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                Browser
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === "terminal" ? (
                <Terminal
                  id={id}
                  logs={realtime.terminal.logs}
                  isConnected={realtime.isConnected}
                  title={flow?.terminal?.containerName}
                />
              ) : (
                <BrowserPreview
                  url={flow?.browser?.url}
                  screenshotUrl={flow?.browser?.screenshotUrl}
                />
              )}
            </div>
          </Panel>
        </div>
      </main>
    </div>
  );
}
