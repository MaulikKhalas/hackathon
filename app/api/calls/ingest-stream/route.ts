import { processUploadedCallAudio } from "@/lib/call-analysis-pipeline";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "No file uploaded." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const fileName = file.name || "recording.mp3";
  const mime = file.type || "application/octet-stream";

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };

      try {
        await processUploadedCallAudio(
          { buffer: buf, fileName, mime },
          {
            onStream: async (e) => {
              send(e);
            },
          },
        );
      } catch (e) {
        send({
          type: "error",
          message:
            e instanceof Error ? e.message : "Processing failed unexpectedly.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
