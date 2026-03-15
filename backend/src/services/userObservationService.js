const { load } = require('../repositories/objectDetailsRepository');
const { getAllObjects } = require('../repositories/objectRepository');
const { timeLabel } = require('../utils/timeLabel');

function getUserObservations(phone) {
  if (!phone) return [];

  const allDetails = load();
  const allObjects = getAllObjects();
  const objectMap = {};
  for (const obj of allObjects) {
    objectMap[String(obj.id)] = obj.name;
  }

  const results = [];

  for (const [objectId, details] of Object.entries(allDetails)) {
    if (!details || !Array.isArray(details.observations)) continue;
    for (const obs of details.observations) {
      if (obs.userPhone !== phone) continue;
      results.push({
        id: obs.id,
        objectId: Number(objectId),
        objectName: objectMap[objectId] || 'Noma\'lum obyekt',
        category: obs.category,
        text: obs.text,
        createdAt: obs.createdAt,
        updatedAt: obs.updatedAt || obs.createdAt,
        timeLabel: timeLabel(obs.createdAt),
        photos: Array.isArray(obs.photos) ? obs.photos : [],
        priority: typeof obs.priority === 'number' ? obs.priority : 0,
        status: obs.status || 'pending',
        confirmedAt: obs.confirmedAt || null,
        resolvedAt: obs.resolvedAt || null,
        rejectedAt: obs.rejectedAt || null,
      });
    }
  }

  results.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return results;
}

module.exports = { getUserObservations };
