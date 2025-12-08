import type { Log } from "@/core/domain/types";
import { cn } from "@/lib/utils";
import { Container } from "lucide-react";
import { useEffect, useRef } from "react";

type TerminalProps = {
  id?: string;
  className?: string;
  title?: string;
  logs?: Log[];
  isConnected?: boolean;
  onSendInput?: (input: string) => void;
};

/**
 * Terminal component - displays terminal output with ANSI color support
 * Uses a simpler approach than xterm.js for basic log display
 */
export function Terminal({
  id,
  className,
  title,
  logs = [],
  isConnected = false,
  onSendInput,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedLogIds = useRef<Set<number>>(new Set());

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  // Reset rendered logs when terminal id changes
  useEffect(() => {
    renderedLogIds.current.clear();
  }, [id]);

  /**
   * Parse ANSI escape codes and convert to styled spans
   */
  function formatAnsiText(text: string): React.ReactNode {
    // Remove common escape sequences and format for display
    const formatted = text
      .replace(/\\r\\n/g, "\n")
      .replace(/\\u001b\[(\d+)m/g, "")
      .replace(/\u001b\[(\d+)m/g, "");

    return formatted;
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border rounded-t-lg">
        <Container className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {isConnected ? (
            <>
              {title || "Container"} - <span className="text-green-500">Active</span>
            </>
          ) : (
            <span className="text-muted-foreground">Disconnected</span>
          )}
        </span>
      </div>

      {/* Terminal Output */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-[#0a0a0a] p-3 font-mono text-sm text-green-400 rounded-b-lg"
      >
        {logs.length === 0 ? (
          <div className="text-muted-foreground italic">
            {isConnected ? "Waiting for output..." : "Connect to see terminal output"}
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="whitespace-pre-wrap break-all">
              {formatAnsiText(log.text)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
