import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { isFailedIngest } from "@/lib/call-record-helpers";
import { formatCallDuration } from "@/lib/format-call-duration";
import type { CallRecord, SentimentLabel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function sentimentVariant(
  s: SentimentLabel,
): "positive" | "neutral" | "negative" {
  return s;
}

function avgScore(c: CallRecord) {
  if (isFailedIngest(c)) return null;
  const v = c.scores;
  return (
    (v.clarity +
      v.politeness +
      v.knowledge +
      v.problemHandling +
      v.listening) /
    5
  );
}

export function RecentCallsTable({ calls }: { calls: CallRecord[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Call</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Sentiment</th>
            <th className="px-4 py-3 font-medium">Avg score</th>
            <th className="px-4 py-3 font-medium">Actions</th>
            <th className="px-4 py-3 font-medium">Duration</th>
            <th className="px-4 py-3 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60 bg-card/30">
          {calls.map((c) => {
            const failed = isFailedIngest(c);
            const avg = avgScore(c);
            return (
              <tr
                key={c.id}
                className={cn(
                  "transition-colors animate-fade-in",
                  failed ? "bg-destructive/5 hover:bg-destructive/10" : (
                    "hover:bg-muted/20"
                  ),
                )}
              >
                <td className="px-4 py-3">
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.createdAt).toLocaleString()}
                  </div>
                  {failed && c.failureReason ?
                    <p
                      className="mt-1 line-clamp-2 text-xs text-destructive/90"
                      title={c.failureReason}
                    >
                      {c.failureReason}
                    </p>
                  : null}
                </td>
                <td className="px-4 py-3">
                  {failed ?
                    <Badge variant="outline" className="border-destructive/40 text-destructive">
                      Failed
                    </Badge>
                  : <Badge variant="secondary">Complete</Badge>}
                </td>
                <td className="px-4 py-3">
                  {failed ?
                    <span className="text-xs text-muted-foreground">—</span>
                  : <Badge variant={sentimentVariant(c.sentiment)}>
                      {c.sentiment}
                    </Badge>}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {avg === null ? "—" : avg.toFixed(1)}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {failed ? "—" : c.actionItems.length}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {failed && c.durationSec <= 0 ?
                      "—"
                    : formatCallDuration(c.durationSec)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {failed ?
                    <span className="text-xs text-muted-foreground">—</span>
                  : <Link
                      href={`/call-detail/${c.id}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Open
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
