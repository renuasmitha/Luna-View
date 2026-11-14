"""Sun/Earth elevation time-series for a lunar-surface site.

Two sources:
  * horizons_series(): real ephemeris from the NASA/JPL Horizons API
    (observer on the Moon's surface, apparent elevation, airless).
  * model_series():    low-precision analytic fallback (same model as the
    in-browser version). Uncertainty of a degree or more.
"""
import math, re, time, json
import urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

R = math.pi / 180
HORIZONS_URL = "https://ssd.jpl.nasa.gov/api/horizons.api"
_cache = {}
TTL = 6 * 3600


def _wrap(a):
    return (a + 180) % 360 - 180


def _geo(dt):
    ms = dt.timestamp() * 1000
    jd = ms / 86400000 + 2440587.5
    d = jd - 2451545
    ph = ((jd - 2451550.26) / 29.530588) % 1
    ls = 280.46 + 0.9856474 * d
    om = 125.04 - 0.0529538 * d
    M = 134.963 + 13.064993 * d
    F = 93.272 + 13.22935 * d
    return (_wrap(180 - 360 * ph), -1.54 * math.sin((ls - om) * R),
            -6.29 * math.sin(M * R), -6.7 * math.sin(F * R))


def _elev(la, lo, dl, db):
    p, l, a, b = la * R, lo * R, db * R, dl * R
    s = (math.cos(a) * math.cos(b), math.cos(a) * math.sin(b), math.sin(a))
    up = (math.cos(p) * math.cos(l), math.cos(p) * math.sin(l), math.sin(p))
    x = sum(i * j for i, j in zip(s, up))
    return math.degrees(math.asin(max(-1, min(1, x))))


def model_series(lat, lon, start, days, step_h):
    n = round(days * 24 / step_h) + 1
    sun, earth = [], []
    for i in range(n):
        sl, sb, el, eb = _geo(start + timedelta(hours=i * step_h))
        sun.append(round(_elev(lat, lon, sl, sb), 3))
        earth.append(round(_elev(lat, lon, el, eb), 3))
    return sun, earth


def _horizons_one(body, lat, lon, start, days, step_h):
    q = {
        "format": "json", "COMMAND": f"'{body}'", "OBJ_DATA": "'NO'",
        "MAKE_EPHEM": "'YES'", "EPHEM_TYPE": "'OBSERVER'",
        "CENTER": "'coord@301'", "COORD_TYPE": "'GEODETIC'",
        "SITE_COORD": f"'{lon},{lat},0'",
        "START_TIME": f"'{start:%Y-%m-%d %H:%M}'",
        "STOP_TIME": f"'{start + timedelta(days=days):%Y-%m-%d %H:%M}'",
        "STEP_SIZE": f"'{max(1, round(step_h * 60))} m'",
        "QUANTITIES": "'4'", "ANG_FORMAT": "'DEG'", "CSV_FORMAT": "'YES'",
        "APPARENT": "'AIRLESS'",
    }
    url = HORIZONS_URL + "?" + urllib.parse.urlencode(q)
    with urllib.request.urlopen(url, timeout=30) as r:
        data = json.loads(r.read().decode())
    return parse_horizons(data.get("result", ""))


def parse_horizons(text):
    """Return elevation list from a Horizons CSV observer table."""
    if "$$SOE" not in text:
        raise ValueError("Horizons returned no ephemeris: " + text[:200].strip())
    body = text.split("$$SOE")[1].split("$$EOE")[0]
    els = []
    for row in body.strip().splitlines():
        nums = []
        for f in row.split(",")[1:]:
            f = f.strip()
            if re.fullmatch(r"-?\d+(\.\d+)?", f):
                nums.append(float(f))
        if len(nums) >= 2:
            els.append(nums[-1])   # columns: azimuth, elevation
    return els


def horizons_series(lat, lon, start, days, step_h):
    key = ("h", round(lat, 4), round(lon, 4), start.isoformat(), days, step_h)
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < TTL:
        return hit[1]
    sun = _horizons_one("10", lat, lon, start, days, step_h)
    earth = _horizons_one("399", lat, lon, start, days, step_h)
    n = round(days * 24 / step_h) + 1
    if len(sun) != n or len(earth) != n:
        raise ValueError(f"Horizons row count mismatch ({len(sun)}/{len(earth)} vs {n})")
    if len(_cache) > 200:
        _cache.clear()
    _cache[key] = (time.time(), (sun, earth))
    return sun, earth
