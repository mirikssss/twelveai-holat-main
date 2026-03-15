const { getOrBuildMapObjects } = require('../services/buildMapDataset');

let cachedObjects = null;

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
