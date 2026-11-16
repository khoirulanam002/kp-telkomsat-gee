// PRAKTIKUM 04 - LULC EKSPANSI: SURABAYA + SIDOARJO + GRESIK
// Klasifikasi: 0=Permukiman, 1=Vegetasi, 2=Air, 3=Tambak, 4=Industri
// Random Forest 50 trees | Sentinel-2 SR 2025 | SCL Cloud Mask

// =============================================================
// 1. AOI
// =============================================================
var aoi = ee.Geometry.Rectangle([112.45, -7.65, 112.95, -7.00]);
Map.centerObject(aoi, 10);
Map.addLayer(aoi, {color: 'red'}, 'AOI Surabaya-Sidoarjo-Gresik');

// =============================================================
// 2. CLOUD MASKING (SCL)
// =============================================================
function maskClouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return image.updateMask(mask);
}

// =============================================================
// 3. COMPOSITE 2025
// =============================================================
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2025-01-01', '2026-01-01')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
  .map(maskClouds);
var composite = s2.median().clip(aoi);
print('Jumlah citra 2025:', s2.size());
// True Color dinonaktifkan — AOI terlalu besar, sebabkan memory error
// Map.addLayer(composite, {bands: ['B4','B3','B2'], min: 0, max: 3000}, 'True Color 2025');

// =============================================================
// 4. TRAINING SAMPLES
// =============================================================

// --- Kelas 0: Permukiman ---
var permukiman = ee.FeatureCollection([
  // Surabaya
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
  // Sidoarjo
  ee.Feature(ee.Geometry.Point([112.72, -7.45]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.74, -7.47]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.70, -7.52]), {kelas: 0}),
  // Gresik (Kebomas)
  ee.Feature(ee.Geometry.Point([112.68, -7.21]), {kelas: 0}),
  ee.Feature(ee.Geometry.Point([112.67, -7.22]), {kelas: 0}),
]);

// --- Kelas 1: Vegetasi ---
// Catatan: titik pusat Surabaya [112.73,-7.30], [112.74,-7.29], [112.78,-7.22]
// diganti ke sawah/ladang Sidoarjo selatan & Gresik barat
// (piksel urban park terlalu mixed dengan Permukiman)
var vegetasi = ee.FeatureCollection([
  // Surabaya — sisa yang lebih jelas
  ee.Feature(ee.Geometry.Point([112.76, -7.37]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.65, -7.27]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.63, -7.25]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.64, -7.30]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.67, -7.35]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.72, -7.39]), {kelas: 1}),
  // Gresik barat — pertanian/ladang
  ee.Feature(ee.Geometry.Point([112.58, -7.18]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.56, -7.20]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.60, -7.12]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.55, -7.22]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.53, -7.17]), {kelas: 1}),
  // Sidoarjo selatan — sawah
  ee.Feature(ee.Geometry.Point([112.70, -7.58]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.68, -7.55]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.73, -7.57]), {kelas: 1}),
  ee.Feature(ee.Geometry.Point([112.69, -7.60]), {kelas: 1}),
]);

// --- Kelas 2: Air ---
var air = ee.FeatureCollection([
  // Selat Madura timur Surabaya
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
  // Selat Madura utara Gresik
  ee.Feature(ee.Geometry.Point([112.65, -7.05]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.72, -7.03]), {kelas: 2}),
  // Perairan Sidoarjo selatan
  ee.Feature(ee.Geometry.Point([112.84, -7.60]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.86, -7.55]), {kelas: 2}),
  ee.Feature(ee.Geometry.Point([112.75, -7.62]), {kelas: 2}),
]);

// --- Kelas 3: Tambak ---
var tambak = ee.FeatureCollection([
  // Surabaya utara
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
  // Sidoarjo pesisir timur
  ee.Feature(ee.Geometry.Point([112.83, -7.47]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.84, -7.50]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.83, -7.52]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.82, -7.55]), {kelas: 3}),
  ee.Feature(ee.Geometry.Point([112.81, -7.48]), {kelas: 3}),
]);

// --- Kelas 4: Industri ---
// 5 titik terverifikasi via Inspector (B11/B8 > 1.0, B8 < 1800)
// 5 titik tambahan cluster KIG (Kawasan Industri Gresik)
var industri = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([112.6612, -7.1600]), {kelas: 4}), // B8=1702, B11=3371 ✅
  ee.Feature(ee.Geometry.Point([112.6172, -7.1306]), {kelas: 4}), // B8=1142, B11=1666 ✅
  ee.Feature(ee.Geometry.Point([112.6180, -7.1400]), {kelas: 4}), // B8=1286, B11=1640 ✅
  ee.Feature(ee.Geometry.Point([112.6277, -7.1480]), {kelas: 4}), // B8=1554, B11=2078 ✅
  ee.Feature(ee.Geometry.Point([112.6301, -7.1585]), {kelas: 4}), // B8=1506, B11=2213 ✅
  ee.Feature(ee.Geometry.Point([112.6400, -7.1550]), {kelas: 4}), // KIG cluster
  ee.Feature(ee.Geometry.Point([112.6450, -7.1500]), {kelas: 4}), // KIG cluster
  ee.Feature(ee.Geometry.Point([112.6350, -7.1480]), {kelas: 4}), // KIG cluster
  ee.Feature(ee.Geometry.Point([112.6250, -7.1400]), {kelas: 4}), // KIG cluster
  ee.Feature(ee.Geometry.Point([112.6220, -7.1350]), {kelas: 4}), // KIG cluster
]);

// =============================================================
// 5. MERGE & EKSTRAK SPEKTRAL
// =============================================================
var trainingPoints = permukiman.merge(vegetasi).merge(air).merge(tambak).merge(industri);
print('Total training points:', trainingPoints.size());
Map.addLayer(trainingPoints, {color: 'yellow'}, 'Training Points');

var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];
var training = composite.select(bands).sampleRegions({
  collection: trainingPoints,
  properties: ['kelas'],
  scale: 30
});

// =============================================================
// 6. KLASIFIKASI RANDOM FOREST
// =============================================================
var classifier = ee.Classifier.smileRandomForest(50)
  .train({features: training, classProperty: 'kelas', inputProperties: bands});
var classified = composite.select(bands).classify(classifier);

var palette = ['d7191c', '1a9641', '2b83ba', 'fdae61', '7b3294'];
Map.addLayer(classified, {min: 0, max: 4, palette: palette}, 'LULC Surabaya-Sidoarjo-Gresik 2025');

// =============================================================
// 7. ACCURACY ASSESSMENT (70/30 split, seed=42)
// =============================================================
var validated   = training.randomColumn('random', 42);
var trainSet    = validated.filter(ee.Filter.lt('random', 0.7));
var testSet     = validated.filter(ee.Filter.gte('random', 0.7));

var classifierFinal = ee.Classifier.smileRandomForest(50)
  .train({features: trainSet, classProperty: 'kelas', inputProperties: bands});

var confMatrix = testSet.classify(classifierFinal).errorMatrix('kelas', 'classification');
print('Confusion Matrix:', confMatrix);
print('Overall Accuracy:', confMatrix.accuracy());
print('Kappa Coefficient:', confMatrix.kappa());

// =============================================================
// 8. HITUNG AREA PER KELAS (km²)
// =============================================================
var areaImage = ee.Image.pixelArea().divide(1e6);
var area = areaImage.addBands(classified).reduceRegion({
  reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'kelas'}),
  geometry: aoi,
  scale: 100,
  maxPixels: 1e9
});
print('Area per kelas (km2):', area);
