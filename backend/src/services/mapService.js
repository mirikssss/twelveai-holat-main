const { getAllObjects, getObjectById } = require('../repositories/objectRepository');
const { haversineDistanceMeters } = require('../utils/distance');
const { deriveStatus } = require('../utils/status');

const DEFAULT_RADIUS_METERS = 2000;

const applySearch = (objects, q) => {
  if (!q) return objects;
  const needle = q.toLowerCase();
  return objects.filter((o) => o.name.toLowerCase().includes(needle));
};

const applyTypeFilter = (objects, type) => {
  if (!type || type === 'all') return objects;
  return objects.filter((o) => o.type === type);
};

const applyStatusFilter = (objects, status) => {
  if (!status || status === 'all') return objects;
  return objects.filter((o) => deriveStatus(o.status) === status);
};

const applyNearby = (objects, lat, lng, radiusMeters) => {
  if (
    typeof lat !== 'number' ||
    Number.isNaN(lat) ||
    typeof lng !== 'number' ||
    Number.isNaN(lng)
  ) {
    return objects;
  }

  const radius = radiusMeters && radiusMeters > 0 ? radiusMeters : DEFAULT_RADIUS_METERS;

  const withDistance = objects
    .map((o) => {
      const [olat, olng] = o.coords;
      const distanceMeters = haversineDistanceMeters([lat, lng], [olat, olng]);
      return { object: o, distanceMeters };
    })
    .filter((item) => item.distanceMeters <= radius);

  withDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return withDistance.map((item) => ({
    ...item.object,
    distanceMeters: Math.round(item.distanceMeters),
  }));
};

const getMapObjects = ({ q, type, status, lat, lng, radius }) => {
  const objects = getAllObjects();

  let result = [...objects];
  result = applySearch(result, q);
  result = applyTypeFilter(result, type);
  result = applyStatusFilter(result, status);

  const hasLocation =
    typeof lat === 'number' &&
    !Number.isNaN(lat) &&
    typeof lng === 'number' &&
    !Number.isNaN(lng);

  if (hasLocation) {
    const radiusMeters = typeof radius === 'number' ? radius : undefined;
    result = applyNearby(result, lat, lng, radiusMeters);
  }

  return result;
};

const getMapObjectById = (id) => {
  return getObjectById(id);
};

const getMapMeta = () => {
  const objects = getAllObjects();

  const totalObjects = objects.length;

  const countsByType = {};
  const countsByStatus = {};

  for (const o of objects) {
    countsByType[o.type] = (countsByType[o.type] || 0) + 1;
    const s = deriveStatus(o.status);
    countsByStatus[s] = (countsByStatus[s] || 0) + 1;
  }

  return {
    totalObjects,
    countsByType,
    countsByStatus,
  };
};

module.exports = {
  getMapObjects,
  getMapObjectById,
  getMapMeta,
};

