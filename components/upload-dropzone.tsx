"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { IngestStreamEvent } from "@/lib/call-analysis-pipeline";
import type { TranscriptSegment } from "@/lib/types";

function speakerLabel(s: TranscriptSegment["speaker"]) {
  return s === "agent" ? "Agent" : "Customer";
}

/** Parse SSE `data: {...}\n\n` blocks from a fetch body. */
async function consumeIngestSse(
  body: ReadableStream<Uint8Array>,
  onEvent: (e: IngestStreamEvent) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processBlock = (block: string) => {
    for (const line of block.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          onEvent(JSON.parse(line.slice(6)) as IngestStreamEvent);
        } catch {
          /* ignore malformed chunk */
        }
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (value) buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      processBlock(block);
    }
    if (done) {
      if (buffer.trim()) processBlock(buffer);
      break;
    }
  }
}

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phaseMessage, setPhaseMessage] = useState("");
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);
  const [wellLines, setWellLines] = useState<string[]>([]);
  const [wrongLines, setWrongLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [segments.length]);

  const run = useCallback(
    async (file: File) => {
      setError(null);
      setBusy(true);
      setPhaseMessage("Uploading…");
      setSegments([]);
      setWellLines([]);
      setWrongLines([]);

      const fd = new FormData();
      fd.set("file", file);

      try {
        const res = await fetch("/api/calls/ingest-stream", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          setError(j.error ?? `Request failed (${res.status})`);
          return;
        }

        if (!res.body) {
          setError("No response body from server.");
          return;
        }

        let navigateId: string | null = null;

        await consumeIngestSse(res.body, (e) => {
          switch (e.type) {
            case "phase":
              setPhaseMessage(e.message);
              break;
            case "transcript":
              /* Full text available; line-by-line UI uses `segment` events. */
              break;
            case "segment":
              setSegments((prev) => [...prev, e.segment]);
              break;
            case "insight":
              if (e.category === "well") {
                setWellLines((prev) => [...prev, e.line]);
              } else {
                setWrongLines((prev) => [...prev, e.line]);
              }
              break;
            case "complete":
              navigateId = e.id;
              break;
            case "error":
              setError(e.message);
              break;
            default:
              break;
          }
        });

        router.refresh();
        if (navigateId) {
          router.push(`/call-detail/${navigateId}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
        router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void run(f);
    },
    [run],
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void run(f);
      e.target.value = "";
    },
    [run],
  );

  const openPicker = useCallback(() => {
    if (!busy) inputRef.current?.click();
  }, [busy]);

  return (
    <div
      role="region"
      aria-label="Upload call recording"
      className="relative"
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav"
        className="sr-only"
        onChange={onChange}
        disabled={busy}
        id="call-recording-upload"
      />

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDrag(false);
          }
        }}
        onDrop={onDrop}
        onClick={(e) => {
          if (busy) return;
          if ((e.target as HTMLElement).closest("button")) return;
          openPicker();
        }}
        className={cn(
          "group flex min-h-[360px] cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-6 py-10 pb-12 text-center transition-all duration-200",
          busy && "min-h-[min(90vh,920px)]",
          drag ?
            "border-primary bg-primary/[0.08] shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
          : "border-border/80 bg-card/40 hover:border-primary/40 hover:bg-card/60",
          busy && "cursor-wait opacity-90",
        )}
      >
        <div
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-200",
            drag ? "scale-105 bg-primary/20 text-primary" : (
              "bg-primary/10 text-primary group-hover:bg-primary/15"
            ),
          )}
        >
          {busy ?
            <Loader2 className="h-8 w-8 animate-spin" />
          : <Mic className="h-8 w-8" />}
        </div>

        <div className="max-w-md space-y-2">
          <p className="text-lg font-semibold tracking-tight text-foreground">
            {busy ? "Processing your recording…" : "Drag & drop your recording"}
          </p>
          <p
            className="text-sm leading-relaxed text-muted-foreground"
            aria-live="polite"
          >
            {busy ?
              phaseMessage || "Working…"
            : "Release the file here, or click anywhere in this area to choose MP3 or WAV from your device."}
          </p>
        </div>

        {busy ?
          <div className="w-full max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full animate-pulse bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
            </div>
          </div>
        : null}

        {busy ?
          <div className="grid w-full max-w-5xl gap-3 text-left md:grid-cols-3">
            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">
                  Live transcript
                </CardTitle>
                <CardDescription className="text-xs">
                  Lines appear as they&apos;re analyzed
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[280px] space-y-1.5 overflow-y-auto text-sm">
                {segments.length === 0 ?
                  <p className="text-xs text-muted-foreground">
                    Waiting for transcript…
                  </p>
                : segments.map((seg) => (
                    <div
                      key={seg.id}
                      className="rounded-md border border-border/50 bg-background/40 px-2 py-1.5"
                    >
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {speakerLabel(seg.speaker)}
                      </span>
                      <p className="leading-snug text-foreground">{seg.text}</p>
                    </div>
                  ))}
                <div ref={transcriptEndRef} />
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">
                  What went well
                </CardTitle>
                <CardDescription className="text-xs">
                  Streaming in real time
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[280px] space-y-1.5 overflow-y-auto text-sm">
                {wellLines.length === 0 ?
                  <p className="text-xs text-muted-foreground">
                    Waiting for insights…
                  </p>
                : wellLines.map((line, i) => (
                    <div
                      key={`w-${i}`}
                      className="rounded-md border border-emerald-500/20 bg-emerald-500/[0.06] px-2 py-1.5 text-foreground"
                    >
                      {line}
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50">
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="text-sm font-medium">
                  What went wrong
                </CardTitle>
                <CardDescription className="text-xs">
                  Streaming in real time
                </CardDescription>
              </CardHeader>
              <CardContent className="max-h-[280px] space-y-1.5 overflow-y-auto text-sm">
                {wrongLines.length === 0 ?
                  <p className="text-xs text-muted-foreground">
                    Waiting for insights…
                  </p>
                : wrongLines.map((line, i) => (
                    <div
                      key={`x-${i}`}
                      className="rounded-md border border-destructive/25 bg-destructive/[0.06] px-2 py-1.5 text-foreground"
                    >
                      {line}
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        : null}

        {!busy ?
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="pointer-events-auto gap-2 shadow-sm"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              openPicker();
            }}
          >
            <Upload className="h-4 w-4" />
            Choose file
          </Button>
        : null}

        {!busy ?
          <p className="text-xs leading-normal text-muted-foreground/80">
            Supported formats: <span className="font-mono text-[11px]">.mp3</span>{" "}
            · <span className="font-mono text-[11px]">.wav</span>
          </p>
        : null}

        {error ?
          <p
            className="max-w-lg text-center text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        : null}
      </div>
    </div>
  );
}
