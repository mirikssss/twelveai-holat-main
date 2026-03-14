const path = require('path');
const { getOrBuildMapObjects } = require('../services/buildMapDataset');

const GENERATED_PATH = path.resolve(__dirname, '..', '..', 'data', 'generated', 'map-objects.json');

let cachedObjects = null;

/**
 * Returns map-ready objects. Uses generated/map-objects.json if present,
 * otherwise builds from enriched-objects.json (image match + fallbacks) and writes generated.
 */
const loadObjects = () => {
  if (cachedObjects) return cachedObjects;
  cachedObjects = getOrBuildMapObjects();
  return cachedObjects;
};

const getAllObjects = () => loadObjects();

const getObjectById = (id) => {
  const objects = loadObjects();
  const numericId = Number(id);
  return objects.find((o) => o.id === numericId) || null;
};

module.exports = {
  getAllObjects,
  getObjectById,
};
