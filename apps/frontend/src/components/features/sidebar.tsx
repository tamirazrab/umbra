import type { FlowOverview, FlowStatus } from "@/core/domain/types";
import { useFlows } from "@/hooks";
import { cn } from "@/lib/utils";
import { Link, useParams } from "@tanstack/react-router";
import { Loader2, MessageSquare, Plus } from "lucide-react";

type SidebarProps = {
  className?: string;
  onNewChat?: () => void;
};

/**
 * Flow item in the sidebar list
 */
function FlowItem({ flow, isActive }: { flow: FlowOverview; isActive: boolean }) {
  const statusColors: Record<FlowStatus, string> = {
    inProgress: "bg-green-500",
    finished: "bg-gray-400",
  };

  return (
    <Link
      to="/chat/$id"
      params={{ id: flow.id.toString() }}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        "hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <div className={cn("w-2 h-2 rounded-full", statusColors[flow.status])} />
      <span className="text-sm truncate flex-1">{flow.name || `Flow ${flow.id}`}</span>
    </Link>
  );
}

/**
 * Sidebar component with flow list and new chat button
 */
export function Sidebar({ className, onNewChat }: SidebarProps) {
  const { id } = useParams({ strict: false });
  const { data: flows, isLoading, error } = useFlows();

  return (
    <aside
      className={cn(
        "flex flex-col w-64 h-full bg-card border-r border-border",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h1 className="text-lg font-semibold">Umbra</h1>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Link
          to="/chat/$id"
          params={{ id: "new" }}
          className={cn(
            "flex items-center justify-center gap-2 w-full px-4 py-2",
            "bg-primary text-primary-foreground rounded-lg",
            "hover:bg-primary/90 transition-colors"
          )}
          onClick={onNewChat}
        >
          <Plus className="w-4 h-4" />
          <span>New Chat</span>
        </Link>
      </div>

      {/* Flow List */}
      <div className="flex-1 overflow-auto p-3 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-sm text-destructive p-3">
            Failed to load flows
          </div>
        ) : flows?.length === 0 ? (
          <div className="text-sm text-muted-foreground p-3 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-xs">Start a new chat to begin</p>
          </div>
        ) : (
          flows?.map((flow) => (
            <FlowItem
              key={flow.id}
              flow={flow}
              isActive={id === flow.id.toString()}
            />
          ))
        )}
      </div>
    </aside>
  );
}
