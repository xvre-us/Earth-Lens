🌍 EarthLens

EarthLens is an open-source prototype developed for the NASA Space Apps Challenge 2026. It turns NASA Earth observation data into an accessible, contextualized evidence-exploration experience for understanding environmental patterns and detected burned areas in a defined Kalimantan study region.

«Raw Earth observation → analysis → spatial context → evidence → human understanding»

🚀 Live Prototype

EarthLens Dashboard:
https://xvre-us.github.io/Earth-Lens-NASA-Space-App-Challenge/frontend/

The current frontend brings together environmental exploration, visualization, scientific context, spatial analysis, and the Evidence Passport concept in one interface.

🎯 What EarthLens Does

EarthLens helps users investigate four connected questions:

- What happened? — Explore environmental variables and detected burned area.
- Where did it happen? — Examine spatial patterns across the study grid.
- When did it happen? — Explore monthly, seasonal, and annual patterns.
- How reliable is the evidence? — Surface data-quality information and limitations instead of hiding them.

The platform is designed to make environmental evidence easier to interpret without presenting statistical associations as causal conclusions.

🛰️ NASA & Earth Observation Data

The scientific workflow combines multiple NASA-derived datasets:

Variable| Product| Unit
Precipitation| GPM IMERG Final v07| mm/month
Air temperature| MERRA-2 M2TMNXSLV| °C
Soil moisture| GLDAS Noah 0–10 cm| kg/m²
Burned area| MODIS MCD64A1.061| km²

The primary study region is a rectangular Kalimantan study box:

111–115.5°E, 3.5°S–0°

This is a research bounding box, not an administrative boundary.

The scientific archive covers January 2003–December 2025. Primary comparative analyses use complete years 2003–2024 because the rainfall record ends in September 2025.

🔬 Scientific Findings

The current analysis identifies several important patterns:

- 97.25% of detected burned area occurred between July and October.
- Seasonal soil moisture and detected burned area show a strong negative Spearman association (ρ = −0.939).
- Seasonal precipitation and detected burned area show a strong negative Spearman association (ρ = −0.935).
- Annual air temperature shows a warming trend of approximately +0.262 °C/decade.
- The annual burned-area trend is method-sensitive and is not presented as a definitive decline.

These are observational statistical relationships. EarthLens does not claim that precipitation, temperature, or soil moisture directly causes the observed burned-area patterns.

🧭 Spatial Analysis

EarthLens also includes a spatial reliability workflow based on MODIS MCD64A1.061 monthly burned-area observations.

The spatial module evaluates:

- cell-level burned-area trends
- coverage quality
- robust trend statistics
- multiple-testing adjustments
- neighborhood slope/sign agreement
- spatial evidence quality

The spatial analysis contains 63 grid cells across the study box, with cells below the selected minimum land-area threshold excluded from annual fitting.

Spatial results are intentionally presented as descriptive evidence, not as proof of field-wide statistically confirmed trends.

🛂 Evidence Passport

One of EarthLens' core ideas is the Evidence Passport.

Environmental results should not be presented without their evidence context. EarthLens therefore surfaces information such as:

- data coverage
- quality warnings
- affected periods
- statistical context
- methodological limitations
- source information

A key example is October 2015, when valid MODIS land coverage fell to approximately 46.6%.

A low-coverage observation should not be interpreted as evidence that fires did not occur. EarthLens treats this uncertainty as part of the result rather than hiding it.

🧠 Why EarthLens?

Earth observation systems produce enormous amounts of valuable information, but the results can be difficult to interpret outside specialist workflows.

EarthLens is designed as a bridge between complex environmental datasets and human understanding:

Accessible → Interpretable → Contextualized → Actionable

The project does not attempt to replace scientific analysis. Instead, it provides an interface through which users can explore evidence, understand its context, and recognize its limitations.

🏗️ Project Architecture

The repository is organized into focused modules:

Earth-Lens-NASA-Space-App-Challenge/
├── frontend/    # Interactive EarthLens dashboard
├── backend/     # Frontend-ready time-series and quality alerts
├── science/     # Regional scientific analysis and evidence
├── spatial/     # Spatial burned-area analysis and reliability
├── insights/    # Evidence interpretation and explanation engine
├── LICENSE
└── README.md

Frontend

The frontend provides the user-facing EarthLens experience, including environmental exploration, visualization, scientific insights, spatial context, and Evidence Passport presentation.

Backend

The backend produces frontend-ready monthly time-series data and data-quality alerts from the team's consolidated NASA-derived dataset.

Science

The science module contains the reproducible regional analysis, statistical tests, source data, derived results, and machine-readable Evidence Passport inputs.

Spatial

The spatial module analyzes the gridded burned-area dataset and produces spatial evidence assets for integration with the dashboard.

Insights

The insights module provides deterministic, evidence-grounded interpretation, explanations, references, and glossary content without requiring an external AI service at runtime.

📊 Data Quality & Methodological Transparency

EarthLens deliberately distinguishes:

- valid retrieval coverage from detection accuracy
- association from causation
- descriptive spatial trends from confirmed field-wide effects
- modeled/reanalysis variables from direct ground observations
- research bounding boxes from administrative boundaries

No missing scientific values are silently converted into zero.

The statistical workflow includes sensitivity checks using HAC errors, Kendall/Sen methods, coverage thresholds, and multiple-testing adjustments where appropriate. These methods are treated as analytical safeguards rather than guarantees of causal or definitive inference.

⚠️ Limitations

EarthLens is a prototype and has important limitations:

- The study region is a rectangular research box, not an administrative region.
- Burned-area observations represent detected burned area and can include repeated burns.
- MODIS coverage is not equivalent to fire-detection accuracy.
- GLDAS and MERRA-2 are modeled/reanalysis products.
- Surface soil moisture is not equivalent to peat water-table depth.
- Statistical associations do not establish causality.
- Spatial neighboring cells should not be treated as independent evidence.
- No wildfire attribution or operational fire forecasting is demonstrated.
- The current prototype does not provide global dynamic environmental monitoring.
- Vegetation NDVI/EVI integration is not part of the current scientific package.

🛠️ Technology

EarthLens uses a lightweight, reproducible stack including:

- NASA Earth observation datasets
- Python
- Pandas
- NumPy
- Statistical analysis
- JavaScript
- HTML/CSS
- JSON
- GitHub / GitHub Pages

The core scientific and interpretation components do not require an external AI service to run.

🔁 Reproducibility

Scientific results can be regenerated from the repository's supplied data and analysis scripts.

For the regional science package:

cd science
pip install -r requirements.txt
python analyze.py

For the spatial package:

cd spatial
pip install -r requirements.txt
python spatial_analysis.py data/Kalimantan_Spatial_Burned_Area.csv --out results
python make_assets.py

For the backend time-series output:

python backend/build_timeseries.py

The repository contains the corresponding inputs, derived results, and documentation needed to understand the analytical workflow.

📚 NASA Sources

EarthLens uses NASA Earth observation and scientific data products including:

- "NASA GPM IMERG" (https://gpm.nasa.gov/data/imerg)
- "NASA MERRA-2" (https://gmao.gsfc.nasa.gov/reanalysis/MERRA-2/)
- "NASA GLDAS" (https://ldas.gsfc.nasa.gov/gldas)
- "NASA MODIS MCD64A1.061" (https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MCD64A1)
- "NASA Giovanni" (https://giovanni.gsfc.nasa.gov/)

🤖 AI Disclosure

AI tools assisted the team with parts of code drafting, statistical analysis, documentation, and visual development.

The reported numerical results and derived scientific assets are generated from the supplied datasets and analysis workflows. The team remains responsible for reviewing the implementation, validating conclusions, and following the NASA Space Apps Challenge submission requirements.

📜 License

This project is licensed under the MIT License.

See "LICENSE" (LICENSE) for the full license text.

---

NASA Space Apps Challenge 2026

EarthLens: Turning Earth observation data into understandable evidence.
