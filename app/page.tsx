import { Activity } from "lucide-react";
import { buildDashboardAggregate } from "@/lib/aggregates";
import { listCalls } from "@/lib/calls-store";
import { KpiStat } from "@/components/dashboard/kpi-stat";
import { KeywordList } from "@/components/dashboard/keyword-list";
import { RecentCallsTable } from "@/components/dashboard/recent-calls-table";
import { SentimentChart } from "@/components/dashboard/sentiment-chart";
import { UploadDropzone } from "@/components/upload-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage() {
  const calls = await listCalls();
  const agg = buildDashboardAggregate(calls);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">
              CallAura AI
            </p>
            <h1 className="text-lg font-semibold leading-tight">
              Call Intelligence
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-3">
          <KpiStat
            label="Total calls"
            value={String(agg.totalCalls)}
            hint="Seven sample calls plus any recordings you upload"
            className="md:col-span-1"
          />
          <KpiStat
            label="Avg performance"
            value={agg.avgOverallScore.toFixed(1)}
            hint="Mean of five score dimensions"
            className="md:col-span-1"
          />
          <KpiStat
            label="Action items"
            value={String(agg.totalActionItems)}
            hint="Open follow-ups across calls"
            className="md:col-span-1"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment distribution</CardTitle>
              <CardDescription>
                Portfolio-level tone across analyzed conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SentimentChart split={agg.sentimentSplit} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Top keywords</CardTitle>
              <CardDescription>
                Weighted by frequency across transcripts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KeywordList items={agg.topKeywords} />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Upload a call recording — the system summarises it
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Add an MP3 or WAV file. We transcribe the audio and produce a
              structured summary: transcript, sentiment, scores, discovery
              checklist, and suggested follow-ups. Completed calls open on a
              detail page automatically.
            </p>
          </div>
          <Card className="border-primary/20 bg-gradient-to-b from-primary/[0.06] via-card to-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <UploadDropzone />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Recent calls</h2>
            <p className="text-sm text-muted-foreground">
              Drill into transcripts, scorecards, discovery, and follow-ups.
            </p>
          </div>
          <RecentCallsTable calls={calls} />
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} CallAura AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
