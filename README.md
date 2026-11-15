# 🌍 Earth Lens

Earth Lens is an open-source prototype developed for the NASA Space Apps Challenge, designed to make Earth observation data more accessible, interpretable, and actionable.

The project integrates real-world NASA datasets to help users explore environmental patterns and investigate relationships between climate variables and burned areas.

🚀 Current Progress

We have successfully downloaded and integrated four real-world datasets from NASA:

- 🌧️ Precipitation
- 🌡️ Air Temperature
- 💧 Soil Moisture
- 🔥 Burned Areas based on MODIS data

These datasets have been consolidated into a single CSV file, allowing us to begin integrating real observations directly into the Earth Lens prototype.

🔎 Preliminary Findings

Our initial analysis has revealed several interesting patterns:

- 97.25% of the detected burned areas were recorded between July and October.
- On a seasonal basis, soil moisture and burned area show a strong negative Spearman correlation of -0.939.
- Seasonal precipitation and burned area show a strong negative correlation of -0.935.
- Annual temperature shows a significant warming trend. However, its direct association with annual burned area was not statistically significant.

These findings suggest that environmental variables may provide valuable contextual signals for understanding wildfire patterns, while also highlighting the importance of analyzing relationships at appropriate temporal scales.

⚠️ Data Quality & the "Evidence Passport"

Our analysis also identified an important data-quality issue.

The valid land-cover data recorded by MODIS dropped to approximately 46.6% in October 2015.

Rather than treating data quality as an invisible technical issue, Earth Lens aims to make it part of the user experience.

This leads to one of our proposed innovations:

«Evidence Passport»

The Evidence Passport will provide users with contextual information about the evidence behind an observation, including potential data-quality warnings.

For example, when a dataset contains an unusual reduction in valid observations, Earth Lens could automatically flag the affected period instead of presenting the result without context.

🛰️ NASA Data Integration

Earth Lens is built around the idea of bringing multiple Earth observation datasets together rather than analyzing environmental variables in isolation.

Our current data pipeline combines:

Dataset| Variable| Purpose
NASA| Precipitation| Examine rainfall patterns
NASA| Air Temperature| Analyze temperature trends
NASA| Soil Moisture| Assess surface moisture conditions
NASA / MODIS| Burned Area| Identify fire-affected regions

The consolidated dataset allows these variables to be explored together within a unified analytical workflow.

🧠 Why Earth Lens?

Earth observation data can be powerful, but it can also be difficult to interpret for users who are not specialists in Earth science, remote sensing, or climate science.

Earth Lens aims to bridge that gap by transforming complex environmental datasets into evidence that is:

Accessible → Interpretable → Contextualized → Actionable

Instead of simply showing a map or a number, Earth Lens aims to help users understand:

- What happened?
- Where did it happen?
- When did it happen?
- What environmental conditions were associated with it?
- How reliable is the underlying evidence?

🛠️ Current Technology

The project is currently being developed using:

- NASA Earth observation datasets
- Python
- Pandas
- NumPy
- Statistical analysis
- CSV-based data integration
- GitHub

Additional visualization and web technologies will be integrated as the prototype evolves.

📊 Current Status

Completed

- [x] NASA dataset acquisition
- [x] Precipitation dataset integration
- [x] Air temperature dataset integration
- [x] Soil moisture dataset integration
- [x] MODIS burned-area dataset integration
- [x] Initial statistical analysis
- [x] Seasonal correlation analysis
- [x] Data-quality assessment
- [x] Consolidation into a unified CSV dataset

In Development

- [ ] Earth Lens interactive dashboard
- [ ] NASA data visualization
- [ ] Interactive environmental maps
- [ ] Evidence Passport
- [ ] Automated data-quality alerts
- [ ] User-friendly interpretation of environmental patterns
- [ ] Integration of additional Earth observation datasets

🌱 Vision

Earth Lens is not intended to replace scientific analysis.

Instead, it aims to serve as a lens between raw Earth observation data and human understanding.

By combining NASA's Earth observation resources with transparent data-quality indicators and accessible visualization, we hope to make environmental evidence easier to explore — for researchers, students, policymakers, and curious citizens alike.

📜 License

This project is licensed under the MIT License.

See ""LICENSE"" (LICENSE) for the full license text.

---

Built for NASA Space Apps Challenge 2026
Earth Lens: Turning Earth observation data into understandable evidence.
