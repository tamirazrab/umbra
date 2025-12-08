import { cn } from "@/lib/utils";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Panel component - a container for grouping related content
 */
export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col rounded-lg border border-border bg-card p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
