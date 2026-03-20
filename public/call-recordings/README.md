# Call recordings (project library)

All audio for this app lives here:

| Kind | Filename pattern | Source |
|------|------------------|--------|
| Hackathon samples | `call-1.mp3` … `call-7.mp3` | Run `npm run sync:samples` or copy manually |
| User uploads | `upload-<uuid>.mp3` (or `.wav`) | Created when you upload from the dashboard |

URLs: `/call-recordings/<filename>`

Metadata for uploads is persisted in `data/user-calls.json`.

Large `.mp3` / `.wav` files are often gitignored; commit if your team shares them.
