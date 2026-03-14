const fs = require('fs');
const path = require('path');
const { enrichObjects } = require('./enrichmentService');

const ENRICHED_PATH = path.resolve(__dirname, '..', '..', 'data', 'enriched-objects.json');
const GENERATED_DIR = path.resolve(__dirname, '..', '..', 'data', 'generated');
const GENERATED_PATH = path.join(GENERATED_DIR, 'map-objects.json');

/**
 * Load raw objects from enriched-objects.json.
 */
function loadSeedObjects() {
  const raw = fs.readFileSync(ENRICHED_PATH, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('enriched-objects.json must be an array');
  return data;
}

/**
 * Build map-ready array (image matching + fallbacks) and return it.
 */
function buildMapObjects() {
  const raw = loadSeedObjects();
  return enrichObjects(raw);
}

/**
 * Ensure data/generated dir exists and write map-objects.json.
 * Returns the built array.
 */
function buildAndWriteGenerated() {
  const objects = buildMapObjects();
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true });
  }
  fs.writeFileSync(GENERATED_PATH, JSON.stringify(objects, null, 2), 'utf8');
  return objects;
}

/**
 * Read generated map-objects.json if it exists and is non-empty.
 * Returns null if file missing or invalid.
 */
function readGeneratedIfExists() {
  if (!fs.existsSync(GENERATED_PATH)) return null;
  try {
    const raw = fs.readFileSync(GENERATED_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) && data.length > 0 ? data : null;
  } catch {
    return null;
  }
}

/**
 * Get map objects: from generated file if present, else build and write it.
 */
function getOrBuildMapObjects() {
  const cached = readGeneratedIfExists();
  if (cached) return cached;
  return buildAndWriteGenerated();
}

if (require.main === module) {
  const objects = buildAndWriteGenerated();
  console.log('Written', objects.length, 'objects to', GENERATED_PATH);
  objects.forEach((o) => {
    if (o.image) console.log('  ', o.name, '->', o.image);
  });
}

module.exports = {
  buildMapObjects,
  buildAndWriteGenerated,
  readGeneratedIfExists,
  getOrBuildMapObjects,
  GENERATED_PATH,
};
