const fs = require('fs');
const { getAllObjects } = require('../repositories/objectRepository');
const { load: loadDetails } = require('../repositories/objectDetailsRepository');
const { resolveReadPath } = require('../utils/dataPath');
const { getObjectStatus } = require('../utils/objectStatusLabels');
const { timeLabel } = require('../utils/timeLabel');

const PUBLIC_STATUSES = ['confirmed', 'in_resolution', 'resolved'];

function isInPeriod(dateStr, period) {
  if (!dateStr || period === 'all') return true;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return true;
  const diffMs = Date.now() - date.getTime();
  if (period === '7d') return diffMs <= 7 * 24 * 60 * 60 * 1000;
  if (period === '30d') return diffMs <= 30 * 24 * 60 * 60 * 1000;
  return true;
}

function loadVerifications(period) {
  try {
    const vPath = resolveReadPath('verifications.json');
    if (!fs.existsSync(vPath)) return 0;
    const verifs = JSON.parse(fs.readFileSync(vPath, 'utf8'));
    if (!Array.isArray(verifs)) return 0;
    return verifs.filter((v) => isInPeriod(v.createdAt, period)).length;
  } catch {
    return 0;
  }
}

function getDashboard({ type = 'all', period = 'all' } = {}) {
  const allObjects = getAllObjects();
  const allDetails = loadDetails();

  // Filter by type
  const objects = type === 'all' ? allObjects : allObjects.filter((o) => o.type === type);

  // Enrich each object with details
  const enriched = objects.map((obj) => {
    const details = allDetails[String(obj.id)] || {};
    const observations = Array.isArray(details.observations) ? details.observations : [];
    const categories = Array.isArray(details.categories) ? details.categories : [];

    // Public observations filtered by status AND period
    const publicObs = observations.filter((obs) => {
      if (obs.status && !PUBLIC_STATUSES.includes(obs.status)) return false;
      return isInPeriod(obs.createdAt, period);
    });

    // Count problematic promise items
    const problematicPromises = categories.reduce((sum, cat) => {
      return sum + (cat.promises || []).filter((p) => p.statusCode === 'attention').length;
    }, 0);

    const dates = publicObs.map((o) => new Date(o.createdAt || 0)).filter((d) => !Number.isNaN(d.getTime()));
    const latestObsDate = dates.length > 0 ? new Date(Math.max(...dates)) : null;

    return {
      ...obj,
      publicObservations: publicObs,
      allObservations: observations,
      categories,
      problematicPromises,
      latestObsDate,
      observationCount: publicObs.length,
    };
  });

  // ─── KPIs ───────────────────────────────────────────────────────────────────
  const totalObjects = enriched.length;
  const attentionObjects = enriched.filter((o) => o.status === 'bad').length;
  const checkingObjects = enriched.filter((o) => o.status === 'mixed').length;
  const confirmedObjects = enriched.filter((o) => o.status === 'good').length;
  const totalNewObs = enriched.reduce((sum, o) => sum + o.observationCount, 0);
  const verificationsCount = loadVerifications(period);

  // ─── Top attention objects ───────────────────────────────────────────────────
  const topAttentionObjects = [...enriched]
    .sort((a, b) => {
      const scoreA =
        a.observationCount * 2 +
        (a.status === 'bad' ? 20 : a.status === 'mixed' ? 10 : 0) +
        a.problematicPromises * 3;
      const scoreB =
        b.observationCount * 2 +
        (b.status === 'bad' ? 20 : b.status === 'mixed' ? 10 : 0) +
        b.problematicPromises * 3;
      return scoreB - scoreA;
    })
    .slice(0, 7)
    .map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      district: o.district,
      address: o.address,
      image: o.image,
      status: o.status,
      objectStatus: getObjectStatus(o.status),
      observationCount: o.observationCount,
      problematicPromises: o.problematicPromises,
      latestSignalAt: o.latestObsDate ? o.latestObsDate.toISOString() : null,
    }));

  // ─── Problem categories ──────────────────────────────────────────────────────
  const catMap = new Map();

  // From observations
  enriched.forEach((obj) => {
    obj.publicObservations.forEach((obs) => {
      const cat = obs.category || 'Boshqa';
      const entry = catMap.get(cat) || { issueCount: 0, affectedObjects: new Set() };
      entry.issueCount += 1;
      entry.affectedObjects.add(obj.id);
      catMap.set(cat, entry);
    });
  });

  // From promise items with 'attention' statusCode
  enriched.forEach((obj) => {
    obj.categories.forEach((cat) => {
      (cat.promises || []).forEach((p) => {
        if (p.statusCode === 'attention' && p.reportedCount > 0) {
          const title = cat.title || 'Boshqa';
          const entry = catMap.get(title) || { issueCount: 0, affectedObjects: new Set() };
          entry.issueCount += p.reportedCount;
          entry.affectedObjects.add(obj.id);
          catMap.set(title, entry);
        }
      });
    });
  });

  const problemCategories = Array.from(catMap.entries())
    .map(([name, data]) => ({
      categoryLabel: name,
      issueCount: data.issueCount,
      affectedObjectsCount: data.affectedObjects.size,
    }))
    .sort((a, b) => b.issueCount - a.issueCount)
    .slice(0, 6);

  // ─── Latest signals ──────────────────────────────────────────────────────────
  const allObs = [];
  enriched.forEach((obj) => {
    obj.publicObservations.forEach((obs) => {
      allObs.push({
        id: obs.id,
        objectId: obj.id,
        objectName: obj.name,
        district: obj.district,
        category: obs.category,
        text: obs.text,
        status: obs.status,
        createdAt: obs.createdAt,
        timeLabel: timeLabel(obs.createdAt),
      });
    });
  });
  allObs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const latestSignals = allObs.slice(0, 7);

  // ─── Objects without verifications ──────────────────────────────────────────
  const objectsWithoutVerifications = [...enriched]
    .filter((o) => !o.totalInspections || o.totalInspections < 5)
    .sort((a, b) => (a.totalInspections || 0) - (b.totalInspections || 0))
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      name: o.name,
      type: o.type,
      district: o.district,
      address: o.address,
      image: o.image,
      status: o.status,
      objectStatus: getObjectStatus(o.status),
      totalInspections: o.totalInspections || 0,
    }));

  // ─── Geo summary ─────────────────────────────────────────────────────────────
  const geoSummary = enriched.map((o) => ({
    id: o.id,
    name: o.name,
    coords: o.coords,
    status: o.status,
    type: o.type,
  }));

  // ─── District summary ────────────────────────────────────────────────────────
  const districtMap = new Map();
  enriched.forEach((o) => {
    const district = o.district || "Noma'lum";
    const entry = districtMap.get(district) || { total: 0, attention: 0, checking: 0, confirmed: 0 };
    entry.total += 1;
    if (o.status === 'bad') entry.attention += 1;
    else if (o.status === 'mixed') entry.checking += 1;
    else if (o.status === 'good') entry.confirmed += 1;
    districtMap.set(district, entry);
  });
  const districtSummary = Array.from(districtMap.entries())
    .map(([district, counts]) => ({ district, ...counts }))
    .sort((a, b) => b.attention - a.attention);

  return {
    summary: {
      totalObjects,
      confirmedObjects,
      attentionObjects,
      checkingObjects,
      newObservationsCount: totalNewObs,
      verificationsCount,
    },
    topAttentionObjects,
    problemCategories,
    latestSignals,
    objectsWithoutVerifications,
    geoSummary,
    districtSummary,
    filters: { type, period },
  };
}

module.exports = { getDashboard };
