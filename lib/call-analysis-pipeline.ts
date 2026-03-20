import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { parseBuffer } from "music-metadata";
import OpenAI, { toFile } from "openai";
import { buildFailedUploadRecord } from "./call-record-helpers";
import { callRecordingsDiskDir } from "./call-storage-paths";
import { upsertCall } from "@/lib/calls-store";
import type { CallRecord, TranscriptSegment } from "@/lib/types";
import { analyzeTranscript, transcribeVerbose } from "@/lib/openai-analysis";

/** Optional streaming callbacks for live UI during ingest (SSE). */
export type IngestStreamEvent =
  | { type: "phase"; message: string }
  | { type: "transcript"; text: string }
  | { type: "segment"; segment: TranscriptSegment }
  | { type: "insight"; category: "well" | "wrong"; line: string }
  | { type: "complete"; id: string }
  | { type: "error"; message: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const ALLOWED = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
]);

function extFor(mime: string, filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".wav")) return ".wav";
  if (lower.endsWith(".mp3")) return ".mp3";
  if (mime.includes("wav")) return ".wav";
  return ".mp3";
}

function titleFromFileName(fileName: string) {
  return (
    fileName
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim() || "Uploaded call"
  );
}

export type PipelineResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Saves audio under public/call-recordings/, transcribes and analyzes.
 * Failures after validation are still persisted so the dashboard lists them.
 */
export async function processUploadedCallAudio(
  input: {
    buffer: Buffer;
    fileName: string;
    mime: string;
  },
  options?: {
    /** Emits live transcript lines + insights for SSE / “Fathom-style” processing UI. */
    onStream?: (e: IngestStreamEvent) => void | Promise<void>;
  },
): Promise<PipelineResult> {
  const id = randomUUID();
  const titleBase = titleFromFileName(input.fileName);
  const stream = options?.onStream;

  const failPersisted = async (
    error: string,
    partial?: { audioUrl: string; durationSec: number },
  ): Promise<PipelineResult> => {
    await stream?.({ type: "error", message: error });
    await upsertCall(
      buildFailedUploadRecord({
        id,
        title: titleBase,
        failureReason: error,
        audioUrl: partial?.audioUrl,
        durationSec: partial?.durationSec,
      }),
    );
    return { ok: false, error };
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return await failPersisted("Missing OPENAI_API_KEY in environment.");
  }

  const mime = input.mime || "application/octet-stream";
  if (!ALLOWED.has(mime) && !input.fileName.match(/\.(mp3|wav)$/i)) {
    return await failPersisted("Only MP3 or WAV files are supported.");
  }

  const ext = extFor(mime, input.fileName);
  const dir = callRecordingsDiskDir();
  await mkdir(dir, { recursive: true });
  const fileName = `upload-${id}${ext}`;
  const diskPath = path.join(dir, fileName);
  const relativePath = `/call-recordings/${fileName}`;
  await writeFile(diskPath, input.buffer);

  let fileDurationRounded = 0;
  try {
    const meta = await parseBuffer(input.buffer);
    const d = meta.format.duration;
    if (d != null && Number.isFinite(d)) fileDurationRounded = Math.round(d);
  } catch {
    /* ignore */
  }

  const uploadable = await toFile(input.buffer, input.fileName || `call${ext}`, {
    type: mime || "audio/mpeg",
  });

  const client = new OpenAI({ apiKey });

  await stream?.({ type: "phase", message: "Transcribing audio…" });

  let verbose;
  try {
    verbose = await transcribeVerbose(client, uploadable);
  } catch (e) {
    return await failPersisted(
      e instanceof Error ?
        e.message
      : "Transcription failed. Check audio format and API key.",
      { audioUrl: relativePath, durationSec: fileDurationRounded },
    );
  }

  await stream?.({ type: "transcript", text: verbose.text });

  await stream?.({ type: "phase", message: "Analyzing call (sentiment, scores, insights)…" });

  let analysis;
  try {
    analysis = await analyzeTranscript(client, verbose.text, verbose.segments);
  } catch (e) {
    return await failPersisted(
      e instanceof Error ? e.message : "Analysis failed. Try a shorter clip or retry.",
      { audioUrl: relativePath, durationSec: fileDurationRounded },
    );
  }

  const lastEnd =
    analysis.segments.length ?
      Math.max(...analysis.segments.map((s) => s.endSec))
    : 0;

  const record: CallRecord = {
    id,
    title: titleBase,
    createdAt: new Date().toISOString(),
    durationSec: Math.max(
      1,
      Math.round(Math.max(lastEnd, fileDurationRounded || lastEnd)),
    ),
    audioUrl: relativePath,
    transcript: analysis.transcript,
    segments: analysis.segments,
    sentiment: analysis.sentiment,
    talkTime: analysis.talkTime,
    scores: analysis.scores,
    discovery: analysis.discovery,
    keywords: analysis.keywords,
    actionItems: analysis.actionItems,
    whatWentWell: analysis.whatWentWell,
    whatWentWrong: analysis.whatWentWrong,
    ingestStatus: "complete",
  };

  if (stream) {
    await stream({ type: "phase", message: "Streaming transcript…" });
    for (const seg of analysis.segments) {
      await stream({ type: "segment", segment: seg });
      await sleep(32);
    }
    await stream({ type: "phase", message: "What went well…" });
    for (const line of analysis.whatWentWell ?? []) {
      await stream({ type: "insight", category: "well", line });
      await sleep(55);
    }
    await stream({ type: "phase", message: "What went wrong…" });
    for (const line of analysis.whatWentWrong ?? []) {
      await stream({ type: "insight", category: "wrong", line });
      await sleep(55);
    }
    await stream({ type: "phase", message: "Saving your call…" });
  }

  await upsertCall(record);

  await stream?.({ type: "complete", id });

  return { ok: true, id };
}
