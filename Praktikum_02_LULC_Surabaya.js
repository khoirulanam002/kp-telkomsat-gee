// 1. AOI - Surabaya
var aoi = ee.Geometry.Rectangle([112.60, -7.40, 112.85, -7.15]);
Map.centerObject(aoi, 11);
Map.addLayer(aoi, {color: 'red'}, 'AOI Surabaya');

// 2. SENTINEL-2
var sentinel2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
var filtered = sentinel2
  .filterBounds(aoi)
  .filterDate('2025-01-01', '2026-01-01')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60));
print('Jumlah citra Sentinel-2:', filtered.size());

// 3. COMPOSITE
var composite = filtered.median().clip(aoi);
print('Citra komposit:', composite);

// 4. TRUE COLOR
var trueColor = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000, gamma: 1.2};
Map.addLayer(composite, trueColor, 'Sentinel-2 True Color');

// 5. NDVI
var ndvi = composite.normalizedDifference(['B8', 'B4']).rename('NDVI');
Map.addLayer(ndvi, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDVI');

// 6. CLOUD MASKING
function maskClouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return image.updateMask(mask);
}
var filtered_masked = filtered.map(maskClouds);
var composite_clean = filtered_masked.median().clip(aoi);
Map.addLayer(composite_clean, {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, 'True Color - Clean');
var ndvi_clean = composite_clean.normalizedDifference(['B8', 'B4']).rename('NDVI_clean');
Map.addLayer(ndvi_clean, {min: -1, max: 1, palette: ['blue', 'white', 'green']}, 'NDVI - Clean');
print('Komposit bersih:', composite_clean);

// MNDWI
var mndwi = composite_clean.normalizedDifference(['B3', 'B11']).rename('MNDWI');
Map.addLayer(mndwi, {min: -1, max: 1, palette: ['red', 'white', 'cyan']}, 'MNDWI Water');

// 7. TRAINING SAMPLES — Iteration 4
var permukiman = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([112.75, -7.26]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.76, -7.27]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.72, -7.30]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.78, -7.32]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.70, -7.23]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.74, -7.33]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.77, -7.24]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.73, -7.22]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.80, -7.28]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.68, -7.31]), {kelas: 0}),
]);
var vegetasi = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([112.73, -7.30]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.74, -7.29]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.76, -7.37]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.65, -7.27]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.78, -7.22]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.63, -7.25]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.64, -7.30]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.67, -7.35]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.72, -7.39]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.66, -7.22]), {kelas: 1}),
]);
var air = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([112.84, -7.22]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.84, -7.28]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.84, -7.33]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.83, -7.30]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.83, -7.18]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.82, -7.20]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.82, -7.25]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.84, -7.35]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.84, -7.17]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.82, -7.38]), {kelas: 2}),
]);
var tambak = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([112.81, -7.33]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.82, -7.35]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.78, -7.19]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.80, -7.37]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.819, -7.342]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.823, -7.350]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.815, -7.345]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.808, -7.355]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.825, -7.345]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.817, -7.338]), {kelas: 3}),
]);
var trainingPoints = permukiman.merge(vegetasi).merge(air).merge(tambak);
print('Jumlah training points:', trainingPoints.size());
Map.addLayer(trainingPoints, {color: 'yellow'}, 'Training Points');

// 8. EKSTRAK NILAI SPEKTRAL
var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];
var training = composite_clean.select(bands).sampleRegions({
  collection: trainingPoints, properties: ['kelas'], scale: 30
});
print('Data training:', training);

// 9. KLASIFIKASI RANDOM FOREST
var classifier = ee.Classifier.smileRandomForest(50)
  .train({features: training, classProperty: 'kelas', inputProperties: bands});
var classified = composite_clean.select(bands).classify(classifier);
var palette = ['d7191c', '1a9641', '2b83ba', 'fdae61'];
Map.addLayer(classified, {min: 0, max: 3, palette: palette}, 'Klasifikasi LULC Surabaya');
print('Klasifikasi selesai:', classified);

// 10. ACCURACY ASSESSMENT
var validated = training.randomColumn('random', 0);
var trainSet = validated.filter(ee.Filter.lt('random', 0.7));
var testSet  = validated.filter(ee.Filter.gte('random', 0.7));
var classifierFinal = ee.Classifier.smileRandomForest(50)
  .train({features: trainSet, classProperty: 'kelas', inputProperties: bands});
var confMatrix = testSet.classify(classifierFinal).errorMatrix('kelas', 'classification');
print('Confusion Matrix:', confMatrix);
print('Overall Accuracy:', confMatrix.accuracy());
print('Kappa Coefficient:', confMatrix.kappa());
print('Producers Accuracy:', confMatrix.producersAccuracy());
print('Consumers Accuracy:', confMatrix.consumersAccuracy());

// EXPORT GEOTIFF
Export.image.toDrive({
  image: classified,
  description: 'LULC_Surabaya',
  folder: 'GEE_Export',
  fileNamePrefix: 'LULC_Surabaya_v4',
  scale: 30,
  region: aoi,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e9
});
