const { getObjectById } = require('../repositories/objectRepository');
const { getDetailsByObjectId, updateDetailsByObjectId } = require('../repositories/objectDetailsRepository');
const { haversineDistanceMeters } = require('../utils/distance');
const { timeLabel } = require('../utils/timeLabel');

const GEO_RADIUS_METERS = 200;

function generateId() {
  return 'obs-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function submitObservation(objectId, body) {
  const { category, text, photo, userLocation, userPhone, userName } = body;

  if (!category || typeof category !== 'string') {
    throw { status: 400, body: { error: 'Missing category', message: 'Kategoriyani tanlang' } };
  }
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw { status: 400, body: { error: 'Missing text', message: 'Muammo haqida batafsil yozing' } };
  }
  if (!photo) {
    throw { status: 400, body: { error: 'Missing photo', message: 'Foto talab qilinadi' } };
  }
  if (!userLocation || typeof userLocation.lat !== 'number' || typeof userLocation.lng !== 'number') {
    throw { status: 400, body: { error: 'Missing userLocation', message: 'Geolokatsiya talab qilinadi' } };
  }

  const numId = Number(objectId);
  const base = getObjectById(numId);
  if (!base) {
    throw { status: 404, body: { error: 'Object not found' } };
  }

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
        message: `Xabar yuborish uchun obyektga yaqinroq bo'lish kerak (${GEO_RADIUS_METERS} m ichida).`,
        distanceToObjectMeters: distanceRounded,
      },
    };
  }

  const now = new Date().toISOString();
  const observation = {
    id: generateId(),
    category: category.trim(),
    text: text.trim(),
    createdAt: now,
    updatedAt: now,
    photos: [photo],
    priority: 2,
    status: 'pending',
    userPhone: userPhone || null,
    userName: userName || null,
    confirmedAt: null,
    resolvedAt: null,
    rejectedAt: null,
  };

  let details = getDetailsByObjectId(numId);
  if (!details) {
    details = { categories: [], observations: [] };
  }
  if (!Array.isArray(details.observations)) {
    details.observations = [];
  }
  details.observations.unshift(observation);
  updateDetailsByObjectId(numId, details);

  return {
    success: true,
    message: "Rahmat, xabar yuborildi",
    observation: {
      ...observation,
      timeLabel: timeLabel(now),
    },
    objectId: numId,
    newObservationsCount: details.observations.length,
  };
}

module.exports = { submitObservation };
