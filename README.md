# Land-Cover-Labeling-Tool-Forest-Non-Forest-in-GEE
An interactive Google Earth Engine (GEE) tool for forest/non-forest labeling using Landsat imagery, ESA WorldCover, and monthly NDVI time series. Features include satellite image visualization, point navigation, manual labeling, and export of training samples for land cover classification and validation.

## Features

- **Interactive Forest/Non-Forest Labeling:** Classify reference points as Forest (1), Non-Forest (0), or Skip (-1).
- **Landsat Imagery Visualization:** Explore monthly Landsat surface reflectance composites.
- **ESA WorldCover Reference:** Visualize global land cover information to support interpretation.
- **Monthly NDVI Time Series:** Examine vegetation dynamics using satellite-derived NDVI.
- **Interactive Point Navigation:** Navigate between sample points and add new reference points.
- **Export Training Samples:** Export labeled reference points as shapefiles (SHP).
- **Interactive Map Interface:** Explore satellite imagery and sample locations through a Google Earth Engine interface.

## Data Sources

- **Landsat 8 Collection 2 Level-2 Surface Reflectance**
- **ESA WorldCover 2020**
- **Google Earth Engine**

## Classification Scheme

| Class | Label | Description |
|---|---|---|
| Forest | 1 | Areas classified as forest |
| Non-Forest | 0 | Areas classified as non-forest |
| Skip | -1 | Uncertain or excluded samples |

## How to Use

1. Open the [Google Earth Engine Code Editor](https://code.earthengine.google.com/).
2. Copy the JavaScript code from `forest_labeling_app.js` into the editor.
3. Update the study area and reference point asset paths to match your own GEE assets.
4. Run the script to launch the interactive labeling interface.
5. Use the month slider to inspect Landsat imagery.
6. Examine monthly NDVI time series for each reference point.
7. Assign Forest (1), Non-Forest (0), or Skip (-1).
8. Navigate between sample points or add new points.
9. Export labeled reference samples as shapefiles.

## Applications

This tool can support:

- Forest and non-forest reference data collection
- Forest disturbance and recovery monitoring
- Satellite-based land cover classification
- Training and validation data preparation
- Vegetation dynamics analysis
- Remote sensing research and education

## Citation

If you use this tool in your research, please cite the following publications where relevant:

**1.** Chen, N., Tsendbazar, N.-E., Hamunyela, E., Verbesselt, J. and Herold, M. (2021). Sub-annual tropical forest disturbance monitoring using harmonized Landsat and Sentinel-2 data. *International Journal of Applied Earth Observation and Geoinformation*, 102, 102386. https://doi.org/10.1016/j.jag.2021.102386

**2.** Chen, N., Tsendbazar, N.-E., Requena Suarez, D., Verbesselt, J. and Herold, M. (2023). Characterizing aboveground biomass and tree cover of regrowing forests in Brazil using multi-source remote sensing data. *Remote Sensing in Ecology and Conservation*, 9(4), 553–567. https://doi.org/10.1002/rse2.328

## Author

**Na Chen**

Swiss Federal Institute for Forest, Snow and Landscape Research (WSL), Switzerland

[Google Scholar](https://scholar.google.com/citations?user=VIiFpBsAAAAJ&hl=en)

## Acknowledgment

This tool was developed using Google Earth Engine to facilitate interactive land cover labeling, satellite imagery interpretation, and reference data collection for forest monitoring research.
