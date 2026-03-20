import { NextResponse } from "next/server";
import { processUploadedCallAudio } from "@/lib/call-analysis-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const result = await processUploadedCallAudio({
    buffer: buf,
    fileName: file.name || "recording.mp3",
    mime: file.type || "application/octet-stream",
  });

  if (!result.ok) {
    const status =
      result.error.includes("OPENAI_API_KEY") ? 503
      : result.error.includes("Only MP3") ? 400
      : 502;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json({ id: result.id });
}
