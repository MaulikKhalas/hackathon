"use server";

import { processUploadedCallAudio } from "@/lib/call-analysis-pipeline";

export type AnalyzeCallActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/** Server action: transcribe uploaded audio, analyze, then persist the call. */
export async function analyzeCallAction(
  formData: FormData,
): Promise<AnalyzeCallActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No audio file provided." };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  return processUploadedCallAudio({
    buffer: buf,
    fileName: file.name || "recording.mp3",
    mime: file.type || "application/octet-stream",
  });
}
