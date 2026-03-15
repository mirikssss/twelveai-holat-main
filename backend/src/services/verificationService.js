const { getObjectById } = require('../repositories/objectRepository');
const { getDetailsByObjectId, updateDetailsByObjectId } = require('../repositories/objectDetailsRepository');
const { addVerification } = require('../repositories/verificationRepository');
const { haversineDistanceMeters } = require('../utils/distance');
const { calcPromiseStatusCode } = require('../utils/promiseStatusCalc');
const { calcObjectStatus } = require('../utils/objectStatusCalc');
const { getPromiseStatus } = require('../utils/promiseStatusLabels');
const { getObjectStatus } = require('../utils/objectStatusLabels');

const GEO_RADIUS_METERS = 200;

function generateId() {
  return 'ver-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * Submit a verification for a promise item.
 * Returns { verification, updatedPromiseItem, updatedObjectStatus } on success.
 * Throws an object { status, body } on validation / business-rule failure.
 */
function submitVerification(objectId, body) {
  const { programItemId, verdict, comment, photo, userLocation } = body;

  // --- Input validation ---
  if (!programItemId) {
    throw { status: 400, body: { error: 'Missing programItemId' } };
  }
  if (!verdict || !['confirmed', 'issue'].includes(verdict)) {
    throw { status: 400, body: { error: 'Invalid verdict', message: "verdict must be 'confirmed' or 'issue'" } };
  }
  if (!photo) {
    throw { status: 400, body: { error: 'Missing photo', message: 'Foto talab qilinadi' } };
  }
  if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
    throw { status: 400, body: { error: 'Missing userLocation', message: 'Geolokatsiya talab qilinadi' } };
  }

  // --- Object lookup ---
  const numId = Number(objectId);
  const base = getObjectById(numId);
  if (!base) {
    throw { status: 404, body: { error: 'Object not found' } };
  }

  // --- Geo check ---
  const objCoords = Array.isArray(base.coords) && base.coords.length >= 2
    ? base.coords
    : null;
  if (!objCoords) {
    throw { status: 400, body: { error: 'Object has no coordinates' } };
  }

  const distance = haversineDistanceMeters(
    [userLocation.lat, userLocation.lng],
    objCoords
  );
  const distanceRounded = Math.round(distance);

  if (distance > GEO_RADIUS_METERS) {
    throw {
      status: 400,
      body: {
        error: 'Too far from object',
        message: `Tekshirish uchun obyektga yaqinroq bo'lish kerak (${GEO_RADIUS_METERS} m ichida).`,
        distanceToObjectMeters: distanceRounded,
      },
    };
  }

  // --- Find promise item in details ---
  const details = getDetailsByObjectId(numId);
  if (!details || !Array.isArray(details.categories)) {
    throw { status: 404, body: { error: 'Object details not found' } };
  }

  let foundPromise = null;
  let foundCategoryIdx = -1;
  let foundPromiseIdx = -1;

  for (let ci = 0; ci < details.categories.length; ci++) {
    const cat = details.categories[ci];
    if (!Array.isArray(cat.promises)) continue;
    for (let pi = 0; pi < cat.promises.length; pi++) {
      if (cat.promises[pi].id === programItemId) {
        foundPromise = cat.promises[pi];
        foundCategoryIdx = ci;
        foundPromiseIdx = pi;
        break;
      }
    }
    if (foundPromise) break;
  }

  if (!foundPromise) {
    throw { status: 404, body: { error: 'Program item not found', message: `programItemId '${programItemId}' topilmadi` } };
  }

  // --- Update counts ---
  if (verdict === 'confirmed') {
    foundPromise.confirmedCount = (foundPromise.confirmedCount || 0) + 1;
  } else {
    foundPromise.reportedCount = (foundPromise.reportedCount || 0) + 1;
  }

  // --- Recalculate promise status ---
  foundPromise.statusCode = calcPromiseStatusCode(foundPromise.confirmedCount, foundPromise.reportedCount);

  // Write back
  details.categories[foundCategoryIdx].promises[foundPromiseIdx] = foundPromise;
  updateDetailsByObjectId(numId, details);

  // --- Recalculate object status ---
  const newObjectStatusCode = calcObjectStatus(details.categories);
  const updatedObjectStatus = getObjectStatus(newObjectStatusCode);

  // --- Save verification record ---
  const verification = {
    id: generateId(),
    objectId: numId,
    programItemId,
    verdict,
    comment: comment || '',
    photo,
    geoVerified: true,
    distanceToObjectMeters: distanceRounded,
    createdAt: new Date().toISOString(),
  };
  addVerification(verification);

  // --- Build response ---
  const updatedPromiseItem = {
    id: foundPromise.id,
    title: foundPromise.title,
    status: getPromiseStatus(foundPromise.statusCode),
    confirmedCount: foundPromise.confirmedCount,
    reportedCount: foundPromise.reportedCount,
  };

  return {
    success: true,
    message: 'Rahmat, tekshiruv yuborildi',
    verification,
    updatedPromiseItem,
    updatedObjectStatus,
  };
}

module.exports = { submitVerification };
