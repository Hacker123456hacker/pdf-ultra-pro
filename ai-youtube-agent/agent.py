#!/usr/bin/env python3
"""Free-first daily narrated YouTube video agent.

Generates structured Hindi content with Gemini, finds Wikimedia Commons visuals,
creates narration with edge-tts, renders a vertical MP4 with FFmpeg, and uploads
it to YouTube using an OAuth refresh token.
"""
import asyncio, json, os, re, subprocess, sys
from pathlib import Path
import requests
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import edge_tts

W, H = 1080, 1920
ROOT = Path(__file__).resolve().parent
OUT = Path(os.getenv("OUTPUT_DIR", str(ROOT / "output")))
ASSETS = OUT / "assets"
LANG = os.getenv("VIDEO_LANGUAGE", "hi-IN")
VOICE = os.getenv("VIDEO_VOICE", "hi-IN-SwaraNeural")
PRIVACY = os.getenv("VIDEO_PRIVACY", "private")
TOPIC = os.getenv("TOPIC", "").strip()
DURATION = int(os.getenv("VIDEO_DURATION", "60"))


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(1)


def gemini(prompt):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        die("GEMINI_API_KEY is missing")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
    payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.8}}
    r = requests.post(url, params={"key": key}, json=payload, timeout=90)
    r.raise_for_status()
    text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.I)
    return json.loads(text)


def make_plan():
    topic_instruction = f"Use this exact topic: {TOPIC}" if TOPIC else "Choose one fresh, evergreen, useful topic suitable for a Hindi Shorts-style video."
    prompt = f"""You are a professional Hindi YouTube Shorts producer. {topic_instruction}
Create a factual, engaging video plan for about {DURATION} seconds. Avoid medical, financial, political persuasion, dangerous instructions, rumors, and copyrighted text. Return ONLY valid JSON with this shape:
{{
  \"title\": \"...\",
  \"description\": \"...\",
  \"tags\": [\"...\"],
  \"scenes\": [
    {{\"search\": \"2-5 English Wikimedia search keywords\", \"caption\": \"short Hindi caption\", \"narration\": \"natural Hindi narration\"}}
  ]
}}
Use exactly 5 scenes. Keep total narration roughly 120-170 Hindi words. Make the title original and not clickbait. Tags should be plain words without #."""
    plan = gemini(prompt)
    if not plan.get("scenes") or len(plan["scenes"]) != 5:
        die("Gemini returned an invalid 5-scene plan")
    return plan


def commons_image(query, path):
    api = "https://commons.wikimedia.org/w/api.php"
    params = {"action":"query","generator":"search","gsrsearch":query,"gsrnamespace":6,
              "gsrlimit":8,"prop":"imageinfo","iiprop":"url","iiurlwidth":1200,"format":"json"}
    try:
        data = requests.get(api, params=params, timeout=30, headers={"User-Agent":"AI-YouTube-Daily-Agent/1.0"}).json()
        pages = data.get("query", {}).get("pages", {})
        for p in pages.values():
            info = (p.get("imageinfo") or [{}])[0]
            url = info.get("thumburl") or info.get("url")
            if not url or not re.search(r"\.(jpg|jpeg|png|webp)(\?|$)", url, re.I):
                continue
            raw = requests.get(url, timeout=45, headers={"User-Agent":"AI-YouTube-Daily-Agent/1.0"}).content
            path.write_bytes(raw)
            Image.open(path).verify()
            return True
    except Exception as e:
        print("visual lookup failed:", e)
    return False


def fallback_image(text, path):
    im = Image.new("RGB", (W, H))
    px = im.load()
    for y in range(H):
        for x in range(W):
            t = (x / W + y / H) / 2
            px[x, y] = (int(18 + 45*t), int(25 + 55*t), int(55 + 100*t))
    im = im.filter(ImageFilter.GaussianBlur(1))
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((70, 690, W-70, 1230), radius=50, fill=(8, 10, 20), outline=(220,220,230), width=3)
    draw.text((110, 790), text[:110], fill="white", font=load_font(58), spacing=14)
    im.save(path, quality=92)


def load_font(size):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/noto/NotoSansDevanagari-Regular.ttf",
        "/usr/share/fonts/opentype/noto/NotoSansDevanagari-Regular.ttf",
    ]
    for f in candidates:
        if Path(f).exists():
            return ImageFont.truetype(f, size)
    return ImageFont.load_default()


def wrap(text, font, max_width):
    words = text.split()
    lines, cur = [], ""
    probe = ImageDraw.Draw(Image.new("RGB", (1,1)))
    for word in words:
        test = (cur + " " + word).strip()
        if probe.textbbox((0,0), test, font=font)[2] <= max_width:
            cur = test
        else:
            if cur: lines.append(cur)
            cur = word
    if cur: lines.append(cur)
    return lines


def make_frame(source, caption, out):
    try:
        im = Image.open(source).convert("RGB")
        scale = max(W/im.width, H/im.height)
        im = im.resize((int(im.width*scale), int(im.height*scale)), Image.Resampling.LANCZOS)
        left, top = (im.width-W)//2, (im.height-H)//2
        im = im.crop((left, top, left+W, top+H))
    except Exception:
        fallback_image(caption, out); return
    overlay = Image.new("RGBA", im.size, (0,0,0,0))
    d = ImageDraw.Draw(overlay)
    d.rectangle((0, H-540, W, H), fill=(0,0,0,175))
    font = load_font(58)
    lines = wrap(caption, font, W-140)
    y = H-470
    for line in lines[:5]:
        d.text((70,y), line, font=font, fill="white", stroke_width=1, stroke_fill="black")
        y += 78
    im = Image.alpha_composite(im.convert("RGBA"), overlay).convert("RGB")
    im.save(out, quality=92)


async def tts(text, out):
    communicate = edge_tts.Communicate(text, VOICE)
    await communicate.save(str(out))


def ffmpeg(*args):
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *map(str,args)]
    subprocess.run(cmd, check=True)


def render(plan):
    OUT.mkdir(parents=True, exist_ok=True); ASSETS.mkdir(parents=True, exist_ok=True)
    clips = []
    for i, scene in enumerate(plan["scenes"], 1):
        visual = ASSETS / f"visual-{i}.jpg"
        frame = ASSETS / f"frame-{i}.jpg"
        audio = ASSETS / f"voice-{i}.mp3"
        clip = ASSETS / f"clip-{i}.mp4"
        if not commons_image(scene.get("search", "technology"), visual):
            fallback_image(scene.get("caption", "आज का ज्ञान"), visual)
        make_frame(visual, scene.get("caption", ""), frame)
        asyncio.run(tts(scene.get("narration", ""), audio))
        ffmpeg("-loop", "1", "-i", frame, "-i", audio, "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H}",
               "-c:v", "libx264", "-preset", "veryfast", "-tune", "stillimage", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-shortest", clip)
        clips.append(clip)
    concat = ASSETS / "concat.txt"
    concat.write_text("\n".join(f"file '{p.resolve()}'" for p in clips), encoding="utf-8")
    final = OUT / "daily-video.mp4"
    ffmpeg("-f", "concat", "-safe", "0", "-i", concat, "-c", "copy", final)
    return final


def upload_youtube(video, plan):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    raw = os.getenv("YOUTUBE_CLIENT_SECRET_JSON")
    refresh = os.getenv("YOUTUBE_REFRESH_TOKEN")
    if not raw or not refresh:
        print("YouTube upload skipped: OAuth secrets are not configured.")
        return None
    info = json.loads(raw)
    cfg = info.get("installed") or info.get("web") or info
    creds = Credentials(token=None, refresh_token=refresh, token_uri="https://oauth2.googleapis.com/token",
                        client_id=cfg["client_id"], client_secret=cfg["client_secret"],
                        scopes=["https://www.googleapis.com/auth/youtube.upload"])
    youtube = build("youtube", "v3", credentials=creds)
    body = {"snippet": {"title": plan["title"][:100], "description": plan["description"][:4900],
                         "tags": plan.get("tags", [])[:30], "categoryId": "22"},
            "status": {"privacyStatus": PRIVACY, "selfDeclaredMadeForKids": False}}
    req = youtube.videos().insert(part="snippet,status", body=body,
                                  media_body=MediaFileUpload(str(video), mimetype="video/mp4", resumable=True))
    response = None
    while response is None:
        _, response = req.next_chunk()
    print("YouTube upload complete:", response.get("id"))
    return response.get("id")


def main():
    plan = make_plan()
    (OUT / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    video = render(plan)
    vid = upload_youtube(video, plan)
    print(json.dumps({"video": str(video), "youtube_id": vid, "title": plan["title"]}, ensure_ascii=False))

if __name__ == "__main__":
    main()
