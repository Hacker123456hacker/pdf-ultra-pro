# AI YouTube Daily Agent

A free-first automation starter that creates a narrated video every day, saves the MP4 as a GitHub Actions artifact, and uploads it to YouTube.

## What it does

1. Gemini generates a topic, title, description, tags, script and scene prompts.
2. Wikimedia Commons supplies reusable/licensed visual assets.
3. `edge-tts` creates narration without a paid TTS API.
4. Pillow + FFmpeg render a vertical 9:16 MP4.
5. YouTube Data API uploads the finished video.
6. GitHub Actions runs automatically at **05:00 Asia/Kolkata** (23:30 UTC).
7. The generated MP4 is retained as a workflow artifact so it can be downloaded to a phone.

> Important: YouTube upload requires OAuth credentials; an API key alone is not sufficient for uploading videos. Never put API keys, client secrets or refresh tokens in this repository.

## Free-first design

The workflow itself is intended to run on GitHub Actions. Gemini usage depends on the limits of the model/API account you use. Wikimedia Commons and FFmpeg are free. `edge-tts` uses Microsoft's public Edge speech service and can change availability/terms; for a production channel, use an officially supported TTS provider if required.

## GitHub Actions secrets

Add these repository secrets:

- `GEMINI_API_KEY`
- `YOUTUBE_CLIENT_SECRET_JSON` — the complete OAuth client JSON downloaded from Google Cloud
- `YOUTUBE_REFRESH_TOKEN` — obtained once by the local OAuth setup flow

Optional:

- `VIDEO_LANGUAGE` (default `hi-IN`)
- `VIDEO_VOICE` (default `hi-IN-SwaraNeural`)
- `VIDEO_PRIVACY` (default `private`; change to `public` only after testing)

Do not commit `.env`, OAuth JSON files, refresh tokens or API keys.

## Local Android / Termux mode

Install FFmpeg, Python and the packages in `requirements.txt`, then export the same environment variables. Run:

```bash
python agent.py
```

The MP4 is written to `output/`. On Android with Termux, point `OUTPUT_DIR` to a shared-storage folder such as `$HOME/storage/downloads/AI-YouTube` after running `termux-setup-storage`.

## Custom topic

The default mode automatically chooses a useful topic. To force a topic locally:

```bash
TOPIC="आज का एक interesting technology fact" python agent.py
```

The GitHub workflow intentionally leaves `TOPIC` empty so the model can choose a fresh topic each day.

## Safety / quality controls

- Default YouTube visibility is `private`.
- The generated script is capped in length.
- The agent refuses to upload if rendering fails.
- Secrets are read only from environment variables.
- No API credentials are included in the frontend/dashboard.

## Dashboard

`dashboard.html` is a static setup/status page. It does not accept or store secrets in browser storage. Use GitHub Actions secrets for automation credentials.
