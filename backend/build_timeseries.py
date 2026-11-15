"""Build backend/output/timeseries.json from science/data/monthly.csv.

Turns the four NASA monthly series (MODIS MCD64A1 burned area, GPM IMERG
precipitation, MERRA-2 air temperature, GLDAS soil moisture) into one JSON
file the frontend chart can load, and flags months where MODIS valid-land
coverage is too low to trust the burned-area value (automated data-quality
alerts).

Rules:
- Blank values stay null (unknown), never 0.
- A burned-area month is flagged when coverage < QUALITY_THRESHOLD.

Run from the repo root:  python backend/build_timeseries.py
Uses only the Python standard library.

AI use (Space Apps SI disclosure): this script was written with help from an
AI assistant (Claude), then run and checked against science/data/monthly.csv.
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "science" / "data" / "monthly.csv"
OUT = ROOT / "backend" / "output" / "timeseries.json"
QUALITY_THRESHOLD = 0.90  # same 90% cut-off used in science/analyze.py

# frontend key -> (csv column, title, unit, NASA source)
VARIABLES = {
    "burned_area": ("burned_area_km2", "Burned area", "km² per month",
                    "MODIS MCD64A1 v6.1 burned area (500 m)"),
    "soil_moisture": ("soil", "Soil moisture (0-10 cm)", "kg/m²",
                      "GLDAS Noah 0.25° monthly (GLDAS_NOAH025_M 2.1)"),
    "precipitation": ("rain", "Precipitation", "mm per month",
                      "GPM IMERG Final monthly (GPM_3IMERGM 07)"),
    "temperature": ("temp", "Air temperature (2 m)", "°C",
                    "MERRA-2 monthly 2 m air temperature (M2TMNXSLV 5.12.4)"),
}


def number(text):
    """Blank means unknown -> None, not 0."""
    text = text.strip()
    return float(text) if text else None


def build():
    rows = list(csv.DictReader(SRC.open(encoding="utf-8")))
    months = [r["date"][:7] for r in rows]  # "2003-01"
    coverage = [number(r["coverage"]) for r in rows]

    series, climatology = {}, {}
    for key, (col, *_rest) in VARIABLES.items():
        values = [number(r[col]) for r in rows]
        series[key] = [None if v is None else round(v, 3) for v in values]
        # Jan..Dec average over all years, ignoring unknown months
        clim = []
        for m in range(1, 13):
            vals = [v for mo, v in zip(months, values) if int(mo[5:]) == m and v is not None]
            clim.append(round(sum(vals) / len(vals), 3) if vals else None)
        climatology[key] = clim

    alerts = [
        {
            "month": mo,
            "coverage": round(c, 3),
            "message": f"Only {c:.1%} of the land had valid MODIS observations in {mo}; "
                       "the burned-area value for this month may be too low.",
        }
        for mo, c in zip(months, coverage)
        if c is not None and c < QUALITY_THRESHOLD
    ]

    return {
        "region": "Kalimantan, Indonesia (111–115.5°E, 3.5°S–0°)",
        "period": f"{months[0]} to {months[-1]}",
        "quality_threshold": QUALITY_THRESHOLD,
        "variables": {k: {"title": t, "unit": u, "source": s}
                      for k, (_c, t, u, s) in VARIABLES.items()},
        "months": months,
        "coverage": [None if c is None else round(c, 4) for c in coverage],
        "series": series,
        "climatology": climatology,
        "quality_alerts": alerts,
        "generated_from": "science/data/monthly.csv",
    }


if __name__ == "__main__":
    data = build()

    # self-check: every series lines up with the months, Oct 2015 is flagged
    n = len(data["months"])
    assert all(len(s) == n for s in data["series"].values()), "series length mismatch"
    assert len(data["coverage"]) == n
    assert any(a["month"] == "2015-10" for a in data["quality_alerts"]), "Oct 2015 not flagged"
    assert all(len(c) == 12 for c in data["climatology"].values())

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    missing = {k: sum(v is None for v in s) for k, s in data["series"].items()}
    print(f"wrote {OUT.relative_to(ROOT)}: {n} months, "
          f"{len(data['quality_alerts'])} quality alerts, unknown values {missing}")
