# LUNA-VIEW

Lunar landing-site planner: Sun and Earth elevation at a south-polar site over time.
Educational decision-support tool, not an official NASA system.

## Run locally
    pip install -r backend/requirements.txt
    uvicorn backend.main:app --reload          # http://localhost:8000
The FastAPI app serves the frontend and the API on one port.

Optional LLM assistant (key stays on the server):
    export ANTHROPIC_API_KEY=...   # see .env.example

## Deploy (Render)
Push this folder to GitHub, create a Render "Blueprint" from it (uses render.yaml), and set
`ANTHROPIC_API_KEY` in the dashboard if you want the LLM assistant. Needs outbound internet
for JPL Horizons.

## Data
* `GET /api/series?lat&lon&start&days&step&source=auto|horizons|model`
  - horizons: JPL Horizons API, observer on the Moon (CENTER=coord@301), apparent airless elevation.
  - model: analytic fallback, uncertainty of a degree or more.
* Sweep chart in the Rescheduling tab uses the local model.
* NOT integrated: LOLA terrain/horizon masks, SPICE kernels, 3D globe.
* Site coordinates are approximate; verify with Moon Trek / LOLA.

Frontend files: frontend/index.html (markup), styles.css (design), app.js (logic). If you open frontend/index.html directly (no backend) it runs on the local model.
To point it at a remote backend: index.html?api=https://your-host
