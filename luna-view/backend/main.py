"""LUNA-VIEW API.  Run from the project root:  uvicorn backend.main:app --reload"""
import json, os, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import ephem

app = FastAPI(title="LUNA-VIEW API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5-5")


@app.get("/api/health")
def health():
    return {"ok": True, "horizons": True, "llm": bool(ANTHROPIC_KEY)}


@app.get("/api/series")
def series(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=360),
           start: str = Query(...), days: int = Query(30, ge=1, le=60),
           step: float = Query(2, ge=0.5, le=24), source: str = Query("auto", pattern="^(auto|horizons|model)$")):
    try:
        t0 = datetime.fromisoformat(start.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, "start must be ISO-8601")
    t0 = (t0 if t0.tzinfo else t0.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)
    reason = None
    if source in ("auto", "horizons"):
        try:
            sun, earth = ephem.horizons_series(lat, lon, t0, days, step)
            return {"source": "horizons", "step_h": step, "sun": sun, "earth": earth}
        except Exception as e:  # network error, Horizons error, row mismatch
            if source == "horizons":
                raise HTTPException(502, f"Horizons failed: {e}")
            reason = str(e)[:200]
    sun, earth = ephem.model_series(lat, lon, t0, days, step)
    return {"source": "model", "step_h": step, "sun": sun, "earth": earth, "fallback_reason": reason}


class Ask(BaseModel):
    question: str
    context: dict


SYSTEM = ("You are the LUNA-VIEW mission assistant. Answer using ONLY the numbers in the JSON context. "
          "Never invent scientific values. Sunlight % is illumination, not electrical power. Earth visibility is "
          "geometric line of sight, not guaranteed communication. No terrain data is used beyond the horizon mask. "
          "Present trade-offs; never call one site universally superior. Be concise. This is an educational "
          "decision-support tool, not an official NASA system.")


@app.post("/api/assistant")
def assistant(body: Ask):
    if not ANTHROPIC_KEY:
        raise HTTPException(503, "LLM not configured")
    payload = {"model": MODEL, "max_tokens": 600, "system": SYSTEM,
               "messages": [{"role": "user", "content": f"Context:\n{json.dumps(body.context)}\n\nQuestion: {body.question[:500]}"}]}
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=json.dumps(payload).encode(),
                                 headers={"x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01",
                                          "content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            out = json.loads(r.read().decode())
        return {"answer": "".join(b.get("text", "") for b in out["content"])}
    except Exception as e:
        raise HTTPException(502, f"LLM error: {str(e)[:150]}")


FRONT = Path(__file__).resolve().parent.parent / "frontend"
if FRONT.exists():
    app.mount("/", StaticFiles(directory=FRONT, html=True), name="front")
