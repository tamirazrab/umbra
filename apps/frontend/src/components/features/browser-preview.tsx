import { cn } from "@/lib/utils";

type BrowserPreviewProps = {
  url?: string;
  screenshotUrl?: string;
  className?: string;
};

/**
 * Browser preview component - displays a screenshot of the browser state
 */
export function BrowserPreview({
  url,
  screenshotUrl,
  className,
}: BrowserPreviewProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* URL Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border rounded-t-lg">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 px-3 py-1 bg-background rounded text-sm text-muted-foreground truncate">
          {url || "about:blank"}
        </div>
      </div>

      {/* Screenshot / Placeholder */}
      <div className="flex-1 overflow-hidden bg-white rounded-b-lg">
        {screenshotUrl ? (
          <img
            src={screenshotUrl}
            alt="Browser screenshot"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <div className="text-4xl mb-2">🌐</div>
              <div className="text-sm">No preview available</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
