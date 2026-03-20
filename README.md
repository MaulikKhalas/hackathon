# CallAura AI · Call Intelligence

Internal hackathon prototype: upload sales call audio (MP3/WAV), transcribe and analyze it, and explore a dark analytics dashboard.

## Requirements

- **Node.js 18.18+**
- **OpenAI API key** in `.env.local` for upload / ingest (optional for browsing seeded data)
- **PostgreSQL** (optional): set `DATABASE_URL` to store uploads in table `call_records` instead of `data/user-calls.json`

## Setup

```bash
npm install
cp .env.example .env.local
# add OPENAI_API_KEY
npm run sync:samples   # copy Call 1–7 into public/call-recordings/ + write duration metadata (see below)
npm run dev
```

`npm run dev` **frees port 3000** (kills whatever is listening), starts Next on **3000**, and **opens your browser** when ready. Use `npm run dev:next-only` if you only want the server without killing the port or opening a tab.

Open [http://localhost:3000](http://localhost:3000).

## Hackathon 2026 sample library (Call 1–7)

The app seeds **seven calls** aligned with your filenames:

`Call-1.mp3`, `Call-2.wav`, `Call 3.wav`, `Call 4.wav`, `Call 5.wav`, `Call 6.wav`, `Call-7.mp3`

- **Playback**: run `npm run sync:samples` so those files are copied to **`public/call-recordings/`** (`call-1.mp3`, …). Override the source folder with `HACKATHON_AUDIO_DIR`.
- **Durations**: the same script writes **`lib/sample-audio-meta.generated.json`** (seconds per file) so the dashboard and detail page match the real audio length. Re-run after you replace sample files.
- **Transcripts in the seed**: **scripted demo dialogue** per call (`lib/hackathon-sample-dialogue.ts`) in the timeline UI — not ASR from the file. **Upload** your own recording for Whisper + full analysis (audio saved as `public/call-recordings/upload-<id>.mp3`, metadata in **PostgreSQL** if `DATABASE_URL` is set, else **`data/user-calls.json`**).

Manifest: `lib/hackathon-sample-manifest.ts` (sample call IDs are UUIDs; `/call-detail/hackathon-call-N` redirects to the canonical id) · Mock builders: `lib/mock-data.ts`

## Features

- **Main dashboard**: total calls, sentiment chart, average score, top keywords, action items, recent calls.
- **Seven seeded hackathon calls** + any uploads from ingest.
- **Upload**: **`POST /api/calls/ingest-stream`** (SSE: live transcript + “what went well/wrong” as they stream) or `POST /api/calls/ingest` / `analyzeCallAction` → same pipeline without streaming UI.
- **Call detail**: audio player, transcript sync, scorecards, discovery checklist, follow-ups.

## Project layout

| Path | Role |
|------|------|
| `app/page.tsx` | Main dashboard |
| `app/call-detail/[id]/page.tsx` | Call workspace (`/call-detail/[id]`; `/calls/[id]` redirects) |
| `app/actions/analyze-call.ts` | **`analyzeCallAction`** — ingest pipeline |
| `lib/call-analysis-pipeline.ts` | Shared ingest logic (action + API route) |
| `lib/discovery-constants.ts` | Hackathon discovery: Budget, Competitors, Kitchen size/scope, Cabinet style |
| `app/api/calls/ingest/route.ts` | REST ingest (same pipeline) |
| `app/api/calls/ingest-stream/route.ts` | SSE ingest — streams phases, transcript segments, insights |
| `lib/hackathon-sample-manifest.ts` | Call 1–7 file mapping |
| `lib/mock-data.ts` | Seeded `CallRecord`s |
| `lib/hackathon-sample-dialogue.ts` | Scripted multi-turn transcript lines for Call 1–7 (timeline demo) |
| `lib/calls-store.ts` | Merges seeded mocks + **Postgres** (`call_records`) or **`data/user-calls.json`** |
| `lib/calls-pg.ts` | Postgres access (auto-creates table) |
| `lib/db.ts` | `pg` pool from `DATABASE_URL` |
| `lib/call-storage-paths.ts` | `public/call-recordings/` + legacy JSON path |
| `db/schema.sql` | Reference DDL for `call_records` |
| `lib/openai-analysis.ts` | Transcription + structured analysis (OpenAI API) |
| `scripts/sync-hackathon-audio.mjs` | Copy samples + write `sample-audio-meta.generated.json` |
| `public/call-recordings/` | **All** audio: hackathon copies + user uploads |
| `data/user-calls.json` | Legacy file store when `DATABASE_URL` is unset |

## PostgreSQL

1. Create a database and set **`DATABASE_URL`** in `.env.local`, e.g. `postgresql://user:pass@localhost:5432/callaura`. Quick local DB: **`docker compose up -d`** then `postgresql://callaura:callaura@localhost:5432/callaura`.
2. Start the app — the **`call_records`** table is created automatically on first write (see `db/schema.sql`).
3. Optional: migrate an existing JSON file: **`npm run db:migrate-json`** (requires `DATABASE_URL`).

## Notes

- **Seeded** hackathon calls (7) are defined in code; **uploaded** calls are reloaded from Postgres or `data/user-calls.json` on each request.
- All audio files live under **`public/call-recordings/`** (large `.wav`/`.mp3` often gitignored by default).
- Commit or regenerate **`lib/sample-audio-meta.generated.json`** after `npm run sync:samples` so durations stay accurate for your copies of the files.

## Stack

Next.js 14 (App Router) · Tailwind CSS · Lucide · Radix (Shadcn-style) · Recharts · OpenAI API · `pg` (optional)
