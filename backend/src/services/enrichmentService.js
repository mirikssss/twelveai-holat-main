const { deriveStatus } = require('../utils/status');
const { findBestImageForObject } = require('./fileImageMatchService');
const { getFallbacks } = require('./fallbackGenerator');

/**
 * Build one map-ready object from raw seed data.
 * Uses image matching when image is empty; applies deterministic fallbacks for missing fields.
 */
const enrichRawObject = (raw) => {
  const image =
    raw.image && String(raw.image).trim()
      ? raw.image
      : findBestImageForObject(raw);

  const fallbacks = getFallbacks(raw);

  return {
    id: raw.id,
    externalId: raw.externalId ?? null,
    name: raw.name,
    type: raw.type,
    coords: raw.coords,
    image: image || '',
    district: fallbacks.district,
    address: fallbacks.address,
    status: deriveStatus(fallbacks.status),
    summary: fallbacks.summary,
    established: fallbacks.established,
    capitalRepair: fallbacks.capitalRepair,
    light: fallbacks.light,
    water: fallbacks.water,
    internet: fallbacks.internet,
    totalInspections: fallbacks.totalInspections,
    promiseCount: fallbacks.promiseCount,
    // Frontend InfraObject expects these for ObjectSheet; empty for map-only MVP
    categories: raw.categories && Array.isArray(raw.categories) ? raw.categories : [],
    observations: raw.observations && Array.isArray(raw.observations) ? raw.observations : [],
  };
};

const enrichObjects = (rawObjects) => rawObjects.map(enrichRawObject);

module.exports = {
  enrichRawObject,
  enrichObjects,
};
