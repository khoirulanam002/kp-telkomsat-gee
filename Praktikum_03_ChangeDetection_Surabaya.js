// PRAKTIKUM 03 - CHANGE DETECTION SURABAYA
// Membandingkan LULC 2020 vs 2025
// 0=Permukiman, 1=Vegetasi, 2=Air, 3=Tambak

// 1. AOI
var aoi = ee.Geometry.Rectangle([112.60, -7.40, 112.85, -7.15]);
Map.centerObject(aoi, 11);

// 2. FUNGSI CLOUD MASKING
function maskClouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return image.updateMask(mask);
}

// 3. COMPOSITE 2020
var s2_2020 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2020-01-01', '2021-01-01')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
  .map(maskClouds);
var composite_2020 = s2_2020.median().clip(aoi);
print('Jumlah citra 2020:', s2_2020.size());
Map.addLayer(composite_2020, {bands: ['B4','B3','B2'], min: 0, max: 3000}, 'True Color 2020');

// 4. COMPOSITE 2025
var s2_2025 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2025-01-01', '2026-01-01')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
  .map(maskClouds);
var composite_2025 = s2_2025.median().clip(aoi);
print('Jumlah citra 2025:', s2_2025.size());
Map.addLayer(composite_2025, {bands: ['B4','B3','B2'], min: 0, max: 3000}, 'True Color 2025');

// 5. TRAINING SAMPLES (sama dengan Iteration 4)
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

// 6. CLASSIFIER (train dari composite 2025)
var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];
var training = composite_2025.select(bands).sampleRegions({
  collection: trainingPoints, properties: ['kelas'], scale: 30
});
var classifier = ee.Classifier.smileRandomForest(50)
  .train({features: training, classProperty: 'kelas', inputProperties: bands});

// 7. KLASIFIKASI KEDUA PERIODE
var classified_2020 = composite_2020.select(bands).classify(classifier);
var classified_2025 = composite_2025.select(bands).classify(classifier);
var palette = ['d7191c', '1a9641', '2b83ba', 'fdae61'];
Map.addLayer(classified_2020, {min: 0, max: 3, palette: palette}, 'LULC 2020');
Map.addLayer(classified_2025, {min: 0, max: 3, palette: palette}, 'LULC 2025');

// 8. CHANGE DETECTION
var changeMap = classified_2020.multiply(10).add(classified_2025);
Map.addLayer(changeMap, {min: 0, max: 33, palette: ['white','red']}, 'Change Map');
print('Change map:', changeMap);

// 9. HITUNG AREA PER KELAS
var areaImage = ee.Image.pixelArea().divide(1e6); // km2
var area_2020 = areaImage.addBands(classified_2020).reduceRegion({
  reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'kelas'}),
  geometry: aoi, scale: 100, maxPixels: 1e9  // ← ubah 30 → 100
});
var area_2025 = areaImage.addBands(classified_2025).reduceRegion({
  reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'kelas'}),
  geometry: aoi, scale: 100, maxPixels: 1e9  // ← ubah 30 → 100
});
print('Area per kelas 2020 (km2):', area_2020);
print('Area per kelas 2025 (km2):', area_2025);
