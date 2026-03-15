const { getObjectById } = require('../repositories/objectRepository');
const { getDetailsByObjectId } = require('../repositories/objectDetailsRepository');
const { getObjectStatus } = require('../utils/objectStatusLabels');
const { getPromiseStatus } = require('../utils/promiseStatusLabels');
const { timeLabel } = require('../utils/timeLabel');

/**
 * Build passport from base object (established, capitalRepair, water, internet).
 * water/internet as "Bor" | "Yo'q".
 */
function buildPassport(base) {
  return {
    established: base.established != null ? base.established : null,
    capitalRepair: base.capitalRepair != null ? String(base.capitalRepair) : null,
    light: base.light === true ? 'Bor' : 'Yo\'q',
    water: base.water === true ? 'Bor' : 'Yo\'q',
    internet: base.internet === true ? 'Bor' : 'Yo\'q',
  };
}

/**
 * Pick latest observation by createdAt; add timeLabel.
 */
function buildLatestObservation(observations) {
  if (!Array.isArray(observations) || observations.length === 0) return null;
  const sorted = [...observations].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const latest = sorted[0];
  return {
    id: latest.id,
    category: latest.category,
    text: latest.text,
    createdAt: latest.createdAt,
    timeLabel: timeLabel(latest.createdAt),
    photos: Array.isArray(latest.photos) ? latest.photos : [],
    priority: typeof latest.priority === 'number' ? latest.priority : 0,
  };
}

/**
 * Map observations from details: add timeLabel.
 */
function mapObservations(observations) {
  if (!Array.isArray(observations)) return [];
  return observations.map((obs) => ({
    id: obs.id,
    category: obs.category,
    text: obs.text,
    createdAt: obs.createdAt,
    timeLabel: timeLabel(obs.createdAt),
    photos: Array.isArray(obs.photos) ? obs.photos : [],
    priority: typeof obs.priority === 'number' ? obs.priority : 0,
  }));
}

/**
 * Map categories from details: add itemsCount, map promise statusCode to { code, label }.
 */
function mapCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return categories.map((cat) => ({
    id: cat.id,
    title: cat.title,
    itemsCount: Array.isArray(cat.promises) ? cat.promises.length : 0,
    promises: (cat.promises || []).map((p) => ({
      id: p.id,
      title: p.title,
      status: getPromiseStatus(p.statusCode),
      confirmedCount: p.confirmedCount != null ? p.confirmedCount : 0,
      reportedCount: p.reportedCount != null ? p.reportedCount : 0,
    })),
  }));
}

/**
 * Build full object detail DTO for GET /api/map/objects/:id (object page).
 * Returns null if base object not found (caller should 404).
 */
function buildFullObjectDetail(id) {
  const base = getObjectById(id);
  if (!base) return null;

  const details = getDetailsByObjectId(id);
  const categories = details ? mapCategories(details.categories) : [];
  const observations = details ? mapObservations(details.observations) : [];

  const [lat, lng] = Array.isArray(base.coords) && base.coords.length >= 2
    ? base.coords
    : [null, null];

  return {
    id: base.id,
    name: base.name,
    type: base.type,
    image: base.image != null ? base.image : '',
    district: base.district != null ? base.district : null,
    address: base.address != null ? base.address : null,
    coords: { lat, lng },
    objectStatus: getObjectStatus(base.status),
    passport: buildPassport(base),
    summary: base.summary != null ? base.summary : '',
    totalInspections: base.totalInspections != null ? base.totalInspections : 0,
    promiseCount: base.promiseCount != null ? base.promiseCount : 0,
    latestObservation: buildLatestObservation(observations),
    newObservationsCount: observations.length,
    categories,
    observations,
  };
}

module.exports = {
  buildFullObjectDetail,
  buildPassport,
  buildLatestObservation,
  mapObservations,
  mapCategories,
};
