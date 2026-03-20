import { Hash } from "lucide-react";
import { cn } from "@/lib/utils";

export function KeywordList({
  items,
}: {
  items: { word: string; count: number }[];
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Upload calls to surface keywords across your library.
      </p>
    );
  }

  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <ul className="space-y-3">
      {items.map((k) => (
        <li key={k.word} className="flex items-center gap-3">
          <Hash className="h-4 w-4 shrink-0 text-primary/80" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-medium capitalize">{k.word}</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {k.count}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-primary/40 to-primary",
                )}
                style={{ width: `${(k.count / max) * 100}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
