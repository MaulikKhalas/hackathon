"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Frown,
  Headphones,
  ListTodo,
  Meh,
  MessageSquare,
  Smile,
  ThumbsUp,
  X,
} from "lucide-react";
import type {
  CallRecord,
  SentimentLabel,
  Speaker,
  TranscriptSegment,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCallDuration } from "@/lib/format-call-duration";
import { resolveCallInsights } from "@/lib/call-insights";
import { isSeededSampleCallId } from "@/lib/hackathon-sample-manifest";
import { cn } from "@/lib/utils";

function sentimentVariant(
  s: CallRecord["sentiment"],
): "positive" | "neutral" | "negative" {
  return s;
}

function formatTimestamp(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SENTIMENT_META: Record<
  SentimentLabel,
  {
    label: string;
    caption: string;
    border: string;
    ring: string;
    Icon: typeof Smile;
  }
> = {
  positive: {
    label: "Positive",
    caption: "Engaged, upbeat, or constructive tone in this span.",
    border: "border-l-emerald-500",
    ring: "ring-emerald-500/30",
    Icon: Smile,
  },
  neutral: {
    label: "Neutral",
    caption: "Informational or balanced exchange.",
    border: "border-l-slate-400",
    ring: "ring-slate-400/25",
    Icon: Meh,
  },
  negative: {
    label: "Negative",
    caption: "Concern, frustration, or pushback in this span.",
    border: "border-l-rose-500",
    ring: "ring-rose-500/30",
    Icon: Frown,
  },
};

const SENTIMENT_ORDER: SentimentLabel[] = ["positive", "neutral", "negative"];

const SPEAKER_META: Record<
  Speaker,
  { label: string; rowBg: string; chip: string }
> = {
  agent: {
    label: "Sales rep",
    rowBg: "bg-sky-500/[0.16]",
    chip:
      "border-sky-400/50 bg-sky-500/20 text-sky-100",
  },
  customer: {
    label: "Customer",
    rowBg: "bg-violet-500/[0.16]",
    chip:
      "border-violet-400/50 bg-violet-500/20 text-violet-100",
  },
};

const SCORE_LABELS: { key: keyof CallRecord["scores"]; label: string }[] = [
  { key: "clarity", label: "Communication clarity" },
  { key: "politeness", label: "Politeness" },
  { key: "knowledge", label: "Business knowledge" },
  { key: "problemHandling", label: "Problem handling" },
  { key: "listening", label: "Listening ability" },
];

/** Scroll `el` only if it sits outside the transcript panel’s visible area. */
function scrollIntoViewIfNeeded(
  container: HTMLElement,
  el: HTMLElement,
  pad = 12,
) {
  const c = container.getBoundingClientRect();
  const e = el.getBoundingClientRect();
  if (e.top < c.top + pad || e.bottom > c.bottom - pad) {
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    });
  }
}

function TranscriptSegmentRow({
  segment: s,
  active,
  onSeek,
  setRef,
}: {
  segment: TranscriptSegment;
  active: boolean;
  onSeek: () => void;
  setRef: (el: HTMLButtonElement | null) => void;
}) {
  const meta = SENTIMENT_META[s.sentiment];
  const Icon = meta.Icon;
  const sp = SPEAKER_META[s.speaker];
  return (
    <button
      ref={setRef}
      type="button"
      onClick={onSeek}
      title={`Jump to ${formatTimestamp(s.startSec)} in recording`}
      className={cn(
        "w-full rounded-lg border border-border/40 py-2.5 pl-3 pr-3 text-left text-sm transition-colors",
        sp.rowBg,
        meta.border,
        "border-l-[6px]",
        active ?
          cn("ring-2 ring-offset-2 ring-offset-background", meta.ring)
        : "hover:brightness-110",
        "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {formatTimestamp(s.startSec)} – {formatTimestamp(s.endSec)}
        </span>
        <span
          className={cn(
            "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            sp.chip,
          )}
        >
          {sp.label}
        </span>
        <span className="inline-flex items-center gap-1">
          <Icon className="h-3.5 w-3.5 opacity-90" />
          <Badge variant={sentimentVariant(s.sentiment)} className="font-semibold">
            {meta.label}
          </Badge>
        </span>
      </div>
      <p className="border-l-2 border-border/60 pl-3 text-base leading-relaxed text-foreground">
        {s.text}
      </p>
    </button>
  );
}

export function CallDetailView({
  call,
  originalAudioUrl,
}: {
  call: CallRecord;
  /** Stored URL before server checks `public/` (used for help text). */
  originalAudioUrl?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [t, setT] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const [transcriptMode, setTranscriptMode] = useState<"timeline" | "bySentiment">(
    "timeline",
  );

  useEffect(() => {
    setMediaError(false);
    setT(0);
  }, [call.id]);

  const orig = originalAudioUrl?.trim() ?? "";
  const isHackathonSample =
    isSeededSampleCallId(call.id) ||
    orig.includes("sample-calls") ||
    (orig.includes("/call-recordings/") && !orig.includes("/upload-"));
  const expectedUpload =
    orig.includes("/call-recordings/upload-") || orig.includes("/uploads/");

  const insights = useMemo(() => resolveCallInsights(call), [call]);

  const sentimentCounts = useMemo(() => {
    const c: Record<SentimentLabel, number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };
    for (const s of call.segments) c[s.sentiment] += 1;
    return c;
  }, [call.segments]);

  const segmentsBySentiment = useMemo(() => {
    const buckets: Record<SentimentLabel, TranscriptSegment[]> = {
      positive: [],
      neutral: [],
      negative: [],
    };
    for (const s of call.segments) buckets[s.sentiment].push(s);
    for (const lab of SENTIMENT_ORDER) {
      buckets[lab].sort((a, b) => a.startSec - b.startSec);
    }
    return buckets;
  }, [call.segments]);

  const activeId = useMemo(() => {
    const seg = call.segments.find((s) => t >= s.startSec && t < s.endSec);
    return seg?.id;
  }, [call.segments, t]);

  const scrollActiveIntoViewIfNeeded = useCallback((segmentId: string) => {
    const container = transcriptScrollRef.current;
    const el = segmentRefs.current[segmentId];
    if (!container || !el) return;
    scrollIntoViewIfNeeded(container, el);
  }, []);

  const scrollSegmentIntoView = useCallback((segmentId: string) => {
    requestAnimationFrame(() => {
      segmentRefs.current[segmentId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }, []);

  const seek = useCallback(
    (startSec: number, segmentId?: string) => {
      const el = audioRef.current;
      if (!el) return;
      el.currentTime = startSec;
      setT(startSec);
      void el.play().catch(() => {});
      if (segmentId) scrollSegmentIntoView(segmentId);
    },
    [scrollSegmentIntoView],
  );

  const hasAudio = Boolean(call.audioUrl?.trim());

  /** Auto-follow transcript while audio plays (and after seek when scrubbing). */
  useEffect(() => {
    if (!activeId) return;
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    scrollActiveIntoViewIfNeeded(activeId);
  }, [activeId, transcriptMode, scrollActiveIntoViewIfNeeded]);

  /** Deep link e.g. /call-detail/x?t=42 — jump once metadata is ready */
  useEffect(() => {
    if (!hasAudio || typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("t");
    const sec = raw === null ? NaN : parseFloat(raw);
    if (!Number.isFinite(sec) || sec < 0) return;
    const el = audioRef.current;
    if (!el) return;
    const apply = () => {
      el.currentTime = sec;
      setT(sec);
    };
    if (el.readyState >= 1) apply();
    else el.addEventListener("loadedmetadata", apply, { once: true });
  }, [call.id, hasAudio, call.audioUrl]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to CallAura AI
      </Link>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{call.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(call.createdAt).toLocaleString()} ·{" "}
            {formatCallDuration(call.durationSec)} · Agent{" "}
            {call.talkTime.agentPct}% / Customer {call.talkTime.customerPct}%
          </p>
        </div>
        <Badge variant={sentimentVariant(call.sentiment)} className="w-fit">
          Overall {call.sentiment}
        </Badge>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">Recording</CardTitle>
              <Headphones className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {hasAudio && !mediaError ?
                <audio
                  ref={audioRef}
                  className="w-full rounded-lg"
                  controls
                  preload="metadata"
                  src={call.audioUrl}
                  onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
                  onPlay={(e) => {
                    const time = e.currentTarget.currentTime;
                    const seg = call.segments.find(
                      (s) => time >= s.startSec && time < s.endSec,
                    );
                    if (seg) scrollActiveIntoViewIfNeeded(seg.id);
                  }}
                  onSeeked={(e) => {
                    const time = e.currentTarget.currentTime;
                    const seg = call.segments.find(
                      (s) => time >= s.startSec && time < s.endSec,
                    );
                    if (seg) scrollActiveIntoViewIfNeeded(seg.id);
                  }}
                  onError={() => setMediaError(true)}
                />
              : null}
              {!hasAudio || mediaError ?
                <div className="space-y-3 rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">
                    {mediaError ?
                      "Could not load this audio file."
                    : "No recording file on disk for this call."}
                  </p>
                  {isHackathonSample ?
                    <p>
                      Put the source file next to the app (e.g.{" "}
                      <code className="font-mono text-xs">Call-7.mp3</code> in your
                      hackathon folder) or set{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs">
                        HACKATHON_AUDIO_DIR
                      </code>{" "}
                      in{" "}
                      <code className="font-mono text-xs">.env.local</code>. You can
                      also run{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs">
                        npm run sync:samples
                      </code>{" "}
                      to copy into{" "}
                      <code className="font-mono text-xs">
                        public/call-recordings/
                      </code>
                      , then refresh.
                    </p>
                  : null}
                  {expectedUpload && (mediaError || !call.audioUrl) ?
                    <p>
                      The file is missing from{" "}
                      <code className="rounded bg-muted px-1 font-mono text-xs">
                        public/call-recordings/
                      </code>
                      . Upload the call again from the dashboard.
                    </p>
                  : null}
                  {mediaError && !isHackathonSample && !expectedUpload ?
                    <p>
                      The recording could not be decoded. Re-upload from the
                      dashboard or use MP3/WAV.
                    </p>
                  : null}
                  {!orig && !mediaError ?
                    <p>
                      This call has no audio path. Upload a recording from the hub
                      to attach a file.
                    </p>
                  : null}
                </div>
              : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1 pb-2">
              <CardTitle className="text-base font-medium">Transcript</CardTitle>
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground/90">Verbatim wording</span>{" "}
                from speech recognition, split by speaker. Each segment includes a{" "}
                <span className="font-medium text-foreground/90">sentiment</span>{" "}
                label (positive / neutral / negative) for that span.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-border/50 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Speakers</span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm bg-sky-500/70"
                      aria-hidden
                    />
                    <span>
                      <span className="text-foreground">Sales rep</span> — what
                      you / the agent said
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm bg-violet-500/70"
                      aria-hidden
                    />
                    <span>
                      <span className="text-foreground">Customer</span> — the other
                      party
                    </span>
                  </span>
                  <span className="hidden sm:inline text-border">|</span>
                  <span>
                    <span className="font-medium text-foreground">Sentiment</span>{" "}
                    per segment — colored left bar + badge match the tone of that
                    wording.
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-muted/15 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Sentiment mix</span>
                  {SENTIMENT_ORDER.map((lab) => {
                    const n = sentimentCounts[lab];
                    if (n === 0) return null;
                    const { Icon } = SENTIMENT_META[lab];
                    return (
                      <span
                        key={lab}
                        className="inline-flex items-center gap-1 rounded-md bg-background/50 px-2 py-0.5"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                        {SENTIMENT_META[lab].label}: {n}
                      </span>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setTranscriptMode("timeline")}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      transcriptMode === "timeline" ?
                        "border-primary/50 bg-primary/15 text-foreground"
                      : "border-border/60 bg-background/30 text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    Timeline (chronological)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranscriptMode("bySentiment")}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      transcriptMode === "bySentiment" ?
                        "border-primary/50 bg-primary/15 text-foreground"
                      : "border-border/60 bg-background/30 text-muted-foreground hover:bg-muted/40",
                    )}
                  >
                    By sentiment
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Click any line to jump to that moment in the recording.
                  {hasAudio ?
                    " Add ?t=seconds to the URL to open at a specific time."
                  : null}
                </p>

                {call.transcript.trim().length > 0 ?
                  <details className="rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-sm">
                    <summary className="cursor-pointer font-medium text-foreground">
                      Full transcript (verbatim, plain text)
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                      {call.transcript}
                    </p>
                  </details>
                : null}

                <div
                  ref={transcriptScrollRef}
                  className="max-h-[480px] space-y-2 overflow-y-auto rounded-lg border border-border/60 bg-background/40 p-3"
                >
                  {transcriptMode === "timeline" ?
                    call.segments.map((s) => (
                      <TranscriptSegmentRow
                        key={s.id}
                        segment={s}
                        active={activeId === s.id}
                        onSeek={() => seek(s.startSec, s.id)}
                        setRef={(el) => {
                          segmentRefs.current[s.id] = el;
                        }}
                      />
                    ))
                  : SENTIMENT_ORDER.map((lab) => {
                      const items = segmentsBySentiment[lab];
                      if (items.length === 0) return null;
                      const meta = SENTIMENT_META[lab];
                      const Icon = meta.Icon;
                      return (
                        <div key={lab} className="space-y-2 pb-4 last:pb-0">
                          <div
                            className={cn(
                              "sticky top-0 z-[1] flex items-center gap-2 border-b border-border/40 bg-background/95 py-2 backdrop-blur-sm",
                              meta.border,
                              "border-l-4 pl-2",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 opacity-90" />
                            <span className="text-sm font-semibold">
                              {meta.label}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({items.length} segment{items.length === 1 ? "" : "s"}
                              )
                            </span>
                          </div>
                          <p className="px-1 text-xs text-muted-foreground">
                            {meta.caption}
                          </p>
                          {items.map((s) => (
                            <TranscriptSegmentRow
                              key={s.id}
                              segment={s}
                              active={activeId === s.id}
                              onSeek={() => seek(s.startSec, s.id)}
                              setRef={(el) => {
                                segmentRefs.current[s.id] = el;
                              }}
                            />
                          ))}
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                Performance (0–10)
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {SCORE_LABELS.map(({ key, label }) => {
                  const v = call.scores[key];
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span>{label}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {v.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={(v / 10) * 100} />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Discovery questionnaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {call.discovery.map((d) => (
                  <li
                    key={d.topic}
                    className="flex gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
                  >
                    <span className="mt-0.5 text-primary">
                      {d.asked ?
                        <Check className="h-4 w-4" />
                      : <X className="h-4 w-4 text-muted-foreground" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-tight">{d.topic}</p>
                      {d.evidence ?
                        <p className="mt-1 text-xs text-muted-foreground">
                          {d.evidence}
                        </p>
                      : null}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                Follow-up items
              </CardTitle>
              <ListTodo className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {insights.followUps.length === 0 ?
                <p className="text-sm text-muted-foreground">
                  No follow-up items were extracted. Check the transcript or add
                  tasks from your CRM.
                </p>
              : (
                <ul className="space-y-2">
                  {insights.followUps.map((item, i) => (
                    <li
                      key={i}
                      className="flex gap-2 rounded-md border border-border/40 bg-background/30 px-3 py-2 text-sm"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {i + 1}.
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.04] to-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                What went well
              </CardTitle>
              <ThumbsUp className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 border-l-2 border-emerald-500/40 pl-3">
                {insights.wentWell.map((line, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm leading-relaxed text-foreground/95"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500/90" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-gradient-to-b from-amber-500/[0.05] to-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                What went wrong
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5 border-l-2 border-amber-500/45 pl-3">
                {insights.wentWrong.map((line, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm leading-relaxed text-foreground/95"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500/90" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
