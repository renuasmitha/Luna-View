# 🌙 LUNA-VIEW

### Lunar Landing Site Intelligence & Mission Planning System
**Every Landing. Every Orbit. Every Decision.**

Built for the **NASA Space Apps Challenge 2026** · Challenge: *Lunar Landing Site Navigator*

> LUNA-VIEW is an educational decision-support tool. It is **not** an official NASA landing-site selection system, and it is not endorsed by or affiliated with NASA.

---

## What it does

Lunar south-pole missions depend on two things: **how much sunlight a site gets** and **when Earth is above the local horizon**. LUNA-VIEW puts both in one interface, so you can compare sites and dates quickly and see what happens when a mission slips.

| Section | What you get |
|---|---|
| **Overview** | Dashboard for the selected site and time, a sky view and a south-polar map |
| **Lunar Explorer** | Candidate sites on a polar map, click to select, custom lat/lon entry |
| **Solar Analysis** | Sun elevation over 30 days, sunrise/sunset estimates, longest sunlit run |
| **Earth Tracker** | Earth elevation, Earthrise estimates, geometric visibility windows |
| **Mission Timeline** | Scrub or play through 30 days; Sun, Earth and overlap windows update live |
| **Compare Missions** | Two scenarios side by side, overlay chart, trade-off summary, suitability index |
| **Rescheduling Simulator** | Slip the launch date by -30 to +60 days and see what changes |
| **Assistant** | Answers questions from the calculated data (rule-based, optional LLM) |

A **horizon mask** slider (0-10°) approximates terrain blocking the horizon.

## Architecture

```
Browser (HTML + CSS + vanilla JS, canvas charts)
        │  GET /api/series      POST /api/assistant
        ▼
FastAPI backend ──► JPL Horizons API  (Sun & Earth elevation, lunar-surface observer)
        │       └─► analytic model    (fallback if Horizons is unreachable)
        └─► Anthropic API (optional, key stays on the server)
```

If no backend is running, the frontend still works using its built-in analytic model. A chip in the top bar always shows which data source is in use.

```
luna-view/
├── backend/
│   ├── __init__.py        # marks the folder as a Python package
│   ├── main.py            # FastAPI routes, serves the frontend
│   ├── ephem.py           # Horizons client + analytic fallback model
│   └── requirements.txt
├── frontend/
│   ├── index.html         # markup
│   ├── styles.css         # design
│   └── app.js             # logic, charts, API calls
├── render.yaml            # one-click Render deploy
├── .env.example
└── README.md
```

## Run locally

```bash
git clone <your-repo-url> && cd luna-view
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

Open http://localhost:8000.

To run the frontend only (local model, no backend), open `frontend/index.html` in a browser.

### Optional: LLM assistant

```bash
export ANTHROPIC_API_KEY=your_key_here
export ANTHROPIC_MODEL=claude-sonnet-5-5   # optional override
```

The key is read by the server only and is never sent to the browser. Without it, the assistant uses rule-based answers. Either way it only quotes numbers the app calculated.

## Deploy

**Render (full app):** push to GitHub → *New → Blueprint* → select the repo (uses `render.yaml`). Add `ANTHROPIC_API_KEY` in the dashboard if you want the LLM assistant. The server needs outbound internet to reach JPL Horizons.

**Frontend only (Netlify / GitHub Pages / Vercel):** upload the `frontend/` folder. It runs on the local model. To use a hosted backend, open the site with `?api=https://your-backend-url`.

## API

`GET /api/series?lat=-89.9&lon=129.8&start=2026-11-14T00:00:00Z&days=30&step=2&source=auto`

| Param | Meaning |
|---|---|
| `lat`, `lon` | Selenographic latitude (-90…90) and east longitude (°) |
| `start` | ISO-8601 UTC start time |
| `days`, `step` | Window length (1-60 days) and step (0.5-24 h) |
| `source` | `auto` (Horizons, then fallback), `horizons`, or `model` |

Returns `{source, step_h, sun[], earth[]}`, elevations in degrees above the local horizon. `GET /api/health` reports backend, Horizons and LLM availability.

## Data sources and honesty notes

| Item | Status |
|---|---|
| Sun/Earth elevation | **JPL Horizons** when the backend is online; otherwise a low-precision analytic model (uncertainty of a degree or more) |
| Site coordinates | Approximate public values, **illustrative**. Verify with Moon Trek / LOLA before relying on them |
| Terrain / horizon | **Not modelled.** Only a user-set flat horizon mask |
| Solar "power opportunity" | Illumination only. Real power depends on array orientation, efficiency, shadows and hardware |
| Earth visibility | Geometric line of sight, **not** guaranteed communication |
| Suitability index | `0.4·sunlight% + 0.4·Earth% + 0.2·overlap%`. Weights are arbitrary and for comparison only, not a validated score |
| Rescheduling sweep chart | Uses the local model, not Horizons |

**Not yet integrated (roadmap):** LOLA terrain and horizon masks, SPICE kernels, a 3D terrain globe (Three.js), exportable comparison reports.

## Resources

- [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/)
- [NASA/JPL NAIF SPICE](https://naif.jpl.nasa.gov/naif/)
- [LRO LOLA (PDS Geosciences)](https://pds-geosciences.wustl.edu/missions/lro/lola.htm)
- [NASA Moon Trek](https://trek.nasa.gov/moon/)

## License

Add a license of your choice (MIT is common for hackathon projects).
