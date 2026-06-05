import os
import json
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from google import genai
from google.genai import types

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
VERTEX_PROJECT = os.getenv("VERTEX_PROJECT")
VERTEX_LOCATION = "asia-south1"
MODEL = "gemini-2.5-flash"


def create_client() -> genai.Client:
    # Prefer Vertex AI (uses Application Default Credentials from `gcloud auth application-default login`)
    if VERTEX_PROJECT:
        try:
            return genai.Client(
                vertexai=True,
                project=VERTEX_PROJECT,
                location=VERTEX_LOCATION,
            )
        except Exception:
            pass
    # Fall back to Google AI Studio with API key
    if GOOGLE_API_KEY:
        return genai.Client(api_key=GOOGLE_API_KEY)
    raise RuntimeError("Set GOOGLE_API_KEY or VERTEX_PROJECT + gcloud ADC credentials")


client = create_client()

MOODS: dict[int, tuple[str, str]] = {
    1: ("😔", "Low"),
    2: ("😕", "Meh"),
    3: ("😊", "Okay"),
    4: ("😄", "Good"),
    5: ("🤩", "Great"),
}

sessions: dict[str, dict] = {}
LOG_FILE = os.path.join(os.path.dirname(__file__), "mood_logs.json")


def append_log(entry: dict) -> None:
    logs: list = []
    if os.path.exists(LOG_FILE):
        try:
            with open(LOG_FILE, "r") as f:
                logs = json.load(f)
        except Exception:
            logs = []
    logs.append(entry)
    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=2, ensure_ascii=False)


app = FastAPI(title="Mood Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response models ──────────────────────────────────────────────────

class CheckinRequest(BaseModel):
    text: str
    selected_score: int | None = None


class CheckinResponse(BaseModel):
    session_id: str
    mood_score: int        # final blended score
    text_score: int        # LLM's read of the text alone
    selected_score: int | None  # user's emoji pick (null if not tapped)
    mood_label: str
    mood_emoji: str
    summary: str
    advice: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.post("/api/checkin", response_model=CheckinResponse)
async def checkin(req: CheckinRequest):
    if not req.text.strip():
        raise HTTPException(400, "Please share how you're feeling")

    hint = (
        f"\nThe user also self-rated their mood as {req.selected_score}/5 — weigh this alongside their words."
        if req.selected_score
        else ""
    )

    prompt = f"""You are an empathetic mood analyst. A user has shared a personal reflection with you.

Their reflection:
"{req.text}"{hint}

Your tasks:
1. Score their mood from 1 to 5:
   1 = Very sad / low / overwhelmed
   2 = Down / meh / a bit off
   3 = Neutral / okay / so-so
   4 = Good / happy / doing well
   5 = Great / excellent / thriving

2. Write a concise analytical summary (2–3 sentences) that:
   - Identifies the key emotional themes and what is driving their mood
   - Notes any tensions or contrasts in what they shared (e.g. tired but fulfilled)
   - Is observational and insightful, not advice-giving

3. Write 2–3 sentences of warm, empathetic advice that:
   - Acknowledges and validates exactly what they expressed
   - Offers gentle encouragement or a hopeful perspective
   - Sounds human and caring — not clinical or generic

Return ONLY valid JSON with no markdown or explanation:
{{"score": <integer 1–5>, "summary": "<analytical read of their emotional state>", "advice": "<empathetic response>"}}"""

    try:
        resp = client.models.generate_content(
            model=MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.75,
                response_mime_type="application/json",
            ),
        )
        data = json.loads(resp.text)
        text_score = max(1, min(5, int(data["score"])))
        summary = str(data["summary"])
        advice = str(data["advice"])
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {e}")

    # Blend: 60% text analysis + 40% self-selected emoji
    if req.selected_score:
        mood_score = max(1, min(5, round(0.6 * text_score + 0.4 * req.selected_score)))
    else:
        mood_score = text_score

    sid = str(uuid.uuid4())
    emoji, label = MOODS[mood_score]

    sessions[sid] = {
        "initial_text": req.text,
        "mood_score": mood_score,
        "text_score": text_score,
        "selected_score": req.selected_score,
        "summary": summary,
        "advice": advice,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    append_log({
        "type": "checkin",
        "session_id": sid,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_text": req.text,
        "text_score": text_score,
        "selected_score": req.selected_score,
        "mood_score": mood_score,
        "mood_label": label,
        "summary": summary,
        "advice": advice,
    })

    return CheckinResponse(
        session_id=sid,
        mood_score=mood_score,
        text_score=text_score,
        selected_score=req.selected_score,
        mood_label=label,
        mood_emoji=emoji,
        summary=summary,
        advice=advice,
    )

