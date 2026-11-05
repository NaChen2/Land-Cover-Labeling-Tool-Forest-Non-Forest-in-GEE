
/*******************************
 * 1. INPUTS + SEQUENTIAL IDS
 *******************************/

var roi = ee.FeatureCollection(
  'projects/nachen/assets/MG_Extent'
);

var TS = ee.FeatureCollection(
  'projects/nachen/assets/MG_200_Random_Points'
);

print('Original points:', TS);

var year = 2024;

// Assign sequential IDs
var pts = TS.toList(TS.size());

var TR = ee.FeatureCollection(
  ee.List.sequence(0, TS.size().subtract(1))
    .map(function(i) {
      i = ee.Number(i);
      return ee.Feature(pts.get(i))
        .set('id', i.add(1));
    })
);

print('Training points:', TR);


/*******************************
 * 2. ESA WORLDCOVER
 *******************************/

var worldCover = ee.ImageCollection(
  'ESA/WorldCover/v100'
).first().clip(roi);

var wcVis = {
  bands: ['Map'],
  min: 10,
  max: 100,
  palette: [
    '006400', // Tree cover
    'ffbb22', // Shrubland
    'ffff4c', // Grassland
    'f096ff', // Cropland
    'fa0000', // Built-up
    'b4b4b4', // Bare
    'f0f0f0', // Snow/Ice
    '0064c8', // Wetland
    '0096a0', // Mangroves
    '00cf75'  // Moss
  ]
};


/*******************************
 * 3. LANDSAT MONTHLY COMPOSITES
 *******************************/

function maskL8sr(image) {
  var qa = image.select('QA_PIXEL');

  var mask = qa.bitwiseAnd(1 << 3).eq(0)
    .and(qa.bitwiseAnd(1 << 4).eq(0))
    .and(qa.bitwiseAnd(1 << 5).eq(0));

  var scaled = image.select(
    ['SR_B5', 'SR_B4', 'SR_B3', 'SR_B2'],
    ['NIR', 'R', 'G', 'B']
  )
  .multiply(0.0000275)
  .add(-0.2);

  return scaled.updateMask(mask)
    .copyProperties(image, ['system:time_start']);
}

var bounds = TR.geometry().bounds();

var l8 = ee.ImageCollection(
  'LANDSAT/LC08/C02/T1_L2'
)
.filterBounds(bounds)
.filterDate(
  ee.Date.fromYMD(year, 1, 1),
  ee.Date.fromYMD(year + 1, 1, 1)
)
.map(maskL8sr);

var months = ee.List.sequence(1, 12);

var monthlyComposite = ee.ImageCollection.fromImages(
  months.map(function(m) {
    m = ee.Number(m);

    var start = ee.Date.fromYMD(year, m, 1);
    var end = start.advance(1, 'month');

    return l8.filterDate(start, end)
      .median()
      .set('month', m)
      .set('system:time_start', start.millis());
  })
);

function getMonthImage(month) {
  return ee.Image(
    monthlyComposite
      .filter(ee.Filter.eq('month', month))
      .first()
  );
}

var rgbVis = {
  min: 0.03,
  max: 0.3,
  gamma: 1.2
};


/*******************************
 * 4. UI: MAP + THREE COLUMNS
 *******************************/

ui.root.clear();

var map = ui.Map();
map.setOptions('SATELLITE');
map.centerObject(roi, 8);

// Main map and control panel
var mainPanel = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {stretch: 'both'}
});

ui.root.add(mainPanel);

map.style().set('stretch', 'both');
mainPanel.add(map);

// Right-side interactive panel
var panel = ui.Panel({
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    width: '950px',
    padding: '10px'
  }
});

mainPanel.add(panel);

// Main title
panel.add(ui.Label({
  value: 'Forest / Non-Forest Labeling Tool',
  style: {
    fontWeight: 'bold',
    fontSize: '22px',
    margin: '0 0 10px 0'
  }
}));

panel.add(ui.Label({
  value: 'Inspect Landsat imagery, examine NDVI, ' +
         'and label forest/non-forest points.',
  style: {
    fontSize: '16px',
    margin: '0 0 10px 0'
  }
}));

// THREE COLUMNS
var column1 = ui.Panel({
  style: {
    width: '240px',
    padding: '5px'
  }
});

var column2 = ui.Panel({
  style: {
    width: '390px',
    padding: '5px'
  }
});

var column3 = ui.Panel({
  style: {
    width: '270px',
    padding: '5px'
  }
});

var columns = ui.Panel({
  widgets: [
    column1,
    column2,
    column3
  ],
  layout: ui.Panel.Layout.flow('horizontal'),
  style: {stretch: 'horizontal'}
});

panel.add(columns);


/*******************************
 * COLUMN 1: IMAGERY & POINTS
 *******************************/

column1.add(ui.Label({
  value: '1. Imagery & Points',
  style: {
    fontWeight: 'bold',
    fontSize: '18px'
  }
}));

column1.add(ui.Label({
  value: 'Month',
  style: {
    fontSize: '17px',
    fontWeight: 'bold'
  }
}));

var monthSlider = ui.Slider({
  min: 1,
  max: 12,
  value: 7,
  step: 1,
  style: {stretch: 'horizontal'}
});

column1.add(monthSlider);

var addPointCheckbox = ui.Checkbox({
  label: 'Click map to add point',
  value: false,
  style: {
    fontSize: '17px'
  }
});

column1.add(addPointCheckbox);

var pointIndexLabel = ui.Label({
  value: 'Point: - / -',
  style: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '10px 0 5px 0'
  }
});

var pointInfoLabel = ui.Label({
  value: 'No point loaded yet.',
  style: {
    fontSize: '17px'
  }
});

column1.add(pointIndexLabel);
column1.add(pointInfoLabel);


/*******************************
 * COLUMN 2: NDVI TIME SERIES
 *******************************/

column2.add(ui.Label({
  value: '2. Monthly NDVI Time Series',
  style: {
    fontWeight: 'bold',
    fontSize: '18px'
  }
}));

var ndviChartPanel = ui.Panel({
  style: {
    width: '380px',
    stretch: 'horizontal'
  }
});

column2.add(ndviChartPanel);


/*******************************
 * COLUMN 3: LABEL & NAVIGATE
 *******************************/

column3.add(ui.Label({
  value: '3. Label & Navigate',
  style: {
    fontWeight: 'bold',
    fontSize: '18px'
  }
}));

var buttonStyle = {
  fontSize: '16px',
  padding: '8px',
  margin: '5px 0',
  stretch: 'horizontal'
};

var forestButton = ui.Button({
  label: 'FOREST (GT = 1)',
  style: buttonStyle
});

var nonForestButton = ui.Button({
  label: 'NON-FOREST (GT = 0)',
  style: buttonStyle
});

var skipButton = ui.Button({
  label: 'SKIP (GT = -1)',
  style: buttonStyle
});

var prevButton = ui.Button({
  label: 'Previous point',
  style: {
    fontSize: '16px',
    padding: '8px',
    margin: '5px 2px'
  }
});

var nextButton = ui.Button({
  label: 'Next point',
  style: {
    fontSize: '16px',
    padding: '8px',
    margin: '5px 2px'
  }
});

var exportButton = ui.Button({
  label: 'Export labeled points (SHP)',
  style: buttonStyle
});

column3.add(forestButton);
column3.add(nonForestButton);
column3.add(skipButton);

column3.add(ui.Panel({
  widgets: [prevButton, nextButton],
  layout: ui.Panel.Layout.flow('horizontal')
}));

column3.add(exportButton);


/*******************************
 * 5. POINT ITERATION
 *******************************/

var ptsList = TR.toList(TR.size());

var nOriginalPoints = ptsList.size().getInfo();

var nPoints = nOriginalPoints;

var currentIndex = 0;

var newPoints = [];

var nextId = nOriginalPoints + 1;

var labeled = [];

function getCurrentFeature() {
  if (currentIndex < nOriginalPoints) {
    return ee.Feature(ptsList.get(currentIndex));
  }

  var newIdx = currentIndex - nOriginalPoints;
  return ee.Feature(newPoints[newIdx]);
}


/*******************************
 * 6. NDVI CHART
 *******************************/

function updateNdviChart(geom) {

  var ndviCollection = monthlyComposite.map(
    function(img) {
      return img.normalizedDifference(
        ['NIR', 'R']
      )
      .rename('NDVI')
      .copyProperties(
        img,
        ['system:time_start', 'month']
      );
    }
  );

  var chart = ui.Chart.image.series({
    imageCollection: ndviCollection,
    region: geom,
    reducer: ee.Reducer.mean(),
    scale: 30
  })
  .setOptions({
    title: 'Monthly Median NDVI - ' + year,
    titleTextStyle: {
      fontSize: 18,
      bold: true
    },
    hAxis: {
      title: 'Month / Date',
      titleTextStyle: {
        fontSize: 16
      },
      textStyle: {
        fontSize: 14
      }
    },
    vAxis: {
      title: 'NDVI',
      titleTextStyle: {
        fontSize: 16
      },
      textStyle: {
        fontSize: 14
      },
      viewWindow: {
        min: -0.2,
        max: 1
      }
    },
    lineWidth: 3,
    pointSize: 5,
    legend: {position: 'none'},
    chartArea: {
      left: 65,
      top: 55,
      width: '75%',
      height: '65%'
    }
  });

  chart.style().set({
    width: '370px',
    height: '320px'
  });

  ndviChartPanel.clear();
  ndviChartPanel.add(chart);
}


/*******************************
 * 7. DISPLAY CURRENT POINT
 *******************************/

function showCurrentPoint() {

  var feature = getCurrentFeature();
  var geom = feature.geometry();

  pointIndexLabel.setValue(
    'Point: ' + (currentIndex + 1) +
    ' / ' + nPoints
  );

  var idProp = ee.Number(
    feature.get('id')
  ).getInfo();

  pointInfoLabel.setValue('ID: ' + idProp);

  var month = monthSlider.getValue();

  var img = getMonthImage(month);

  map.layers().reset();

  // ESA WorldCover
  map.addLayer(
    worldCover,
    wcVis,
    'ESA WorldCover 2020'
  );

  // Landsat RGB
  map.addLayer(
    img.clip(bounds).select(['R', 'G', 'B']),
    rgbVis,
    'Landsat RGB - ' + year + ' Month ' + month
  );

  // NDVI
  var ndvi = img.normalizedDifference(
    ['NIR', 'R']
  ).rename('NDVI');

  map.addLayer(
    ndvi.clip(bounds),
    {
      min: 0,
      max: 1,
      palette: ['brown', 'yellow', 'green']
    },
    'NDVI - Month ' + month,
    false
  );

  // Current point
  map.addLayer(
    geom,
    {color: 'red', pointRadius: 7},
    'Current point'
  );

  map.centerObject(geom, 15);

  updateNdviChart(geom);
}


/*******************************
 * 8. MONTH SLIDER CALLBACK
 *******************************/

monthSlider.onChange(function(value) {
  if (nPoints > 0) {
    showCurrentPoint();
  }
});


/*******************************
 * 9. ADD NEW POINTS
 *******************************/

map.onClick(function(coords) {

  if (!addPointCheckbox.getValue()) {
    return;
  }

  var geom = ee.Geometry.Point([
    coords.lon,
    coords.lat
  ]);

  var newFeat = ee.Feature(geom, {
    id: nextId,
    GT: -1
  });

  newPoints.push(newFeat);

  nextId += 1;
  nPoints += 1;

  currentIndex = nPoints - 1;

  showCurrentPoint();
});


/*******************************
 * 10. LABELING ACTIONS
 *******************************/

function labelCurrentPoint(gtValue) {

  if (nPoints === 0) {
    return;
  }

  var feature = getCurrentFeature();

  var labeledFeature = feature.set(
    'GT',
    gtValue
  );

  labeled[currentIndex] = labeledFeature;

  if (currentIndex < nPoints - 1) {
    currentIndex += 1;
    showCurrentPoint();
  } else {
    print(
      'Reached the last point. ' +
      'You can export the labeled collection.'
    );
  }
}

forestButton.onClick(function() {
  labelCurrentPoint(1);
});

nonForestButton.onClick(function() {
  labelCurrentPoint(0);
});

skipButton.onClick(function() {
  labelCurrentPoint(-1);
});


/*******************************
 * 11. POINT NAVIGATION
 *******************************/

prevButton.onClick(function() {

  if (currentIndex > 0) {
    currentIndex -= 1;
    showCurrentPoint();
  }

});

nextButton.onClick(function() {

  if (currentIndex < nPoints - 1) {
    currentIndex += 1;
    showCurrentPoint();
  }

});


/*******************************
 * 12. EXPORT LABELED POINTS
 *******************************/

exportButton.onClick(function() {

  var cleaned = labeled.filter(function(f) {
    return f !== undefined;
  });

  if (cleaned.length === 0) {
    print('No labeled points yet.');
    return;
  }

  var fc = ee.FeatureCollection(cleaned);

  print('Labeled training points:', fc);

  Export.table.toDrive({
    collection: fc,
    description: 'TS_2023_SHP',
    fileNamePrefix: 'TS_2023',
    folder: 'test_GT_2025_1205',
    fileFormat: 'SHP'
  });

  print(
    'Export task created. ' +
    'Go to the Tasks tab to start export.'
  );

});


/*******************************
 * 13. INITIALIZE
 *******************************/

if (nOriginalPoints === 0) {
  print('No original points. Enable add-point mode.');
} else {
  showCurrentPoint();
}
