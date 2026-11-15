# EarthLens backend: monthly time series + data-quality alerts

`build_timeseries.py` turns the team's NASA monthly table
(`science/data/monthly.csv`) into one JSON file the frontend can load:
`backend/output/timeseries.json`. It does not change any frontend file.

```
python backend/build_timeseries.py
```

Standard library only (no installs). The script checks its own output
(every series has one value per month, October 2015 is flagged) before writing.

## What is in `timeseries.json`

| Key | What it holds |
|---|---|
| `months` | `"2003-01"` … `"2025-12"` (276 months) |
| `series.burned_area` | MODIS MCD64A1 burned area, km² per month |
| `series.soil_moisture` | GLDAS Noah 0–10 cm soil moisture, kg/m² |
| `series.precipitation` | GPM IMERG Final precipitation, mm per month |
| `series.temperature` | MERRA-2 2 m air temperature, °C |
| `coverage` | share of land with valid MODIS observations (0–1) |
| `climatology.<variable>` | average for Jan … Dec over all years (12 values) |
| `quality_alerts` | every month with coverage below 90%, with a plain-language message |
| `variables.<variable>` | title, unit and NASA source for each series |

Rules: a blank value in the source stays `null` (unknown), never 0. The 90%
cut-off is the same one used in `science/analyze.py`.

## Current results

- 276 months, 2003-01 to 2025-12.
- 10 data-quality alerts. The worst is October 2015, with 46.6% coverage.
- 3 unknown precipitation months at the end of 2025 (not yet available from GPM).

## Using it in the frontend (optional)

```js
const ts = await fetch("../backend/output/timeseries.json").then(r => r.json());
// ts.months -> x-axis labels, ts.series.burned_area -> y values
// ts.quality_alerts -> list of { month, coverage, message }
```

AI use: this script was written with help from an AI assistant (Claude) and
checked by running it on the team's data.
