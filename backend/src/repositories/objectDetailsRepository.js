const fs = require('fs');
const { resolveReadPath, resolveWritePath } = require('../utils/dataPath');

let cached = null;

function getPath() {
  return resolveReadPath('object-details.json');
}

function load() {
  if (cached) return cached;
  const p = getPath();
  if (!fs.existsSync(p)) {
    cached = {};
    return cached;
  }
  try {
    const raw = fs.readFileSync(p, 'utf8');
    cached = JSON.parse(raw);
    return cached && typeof cached === 'object' ? cached : {};
  } catch {
    cached = {};
    return cached;
  }
}

function getDetailsByObjectId(objectId) {
  const data = load();
  return data[String(objectId)] || null;
}

function saveAll(data) {
  const p = resolveWritePath('object-details.json');
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  cached = data;
}

function updateDetailsByObjectId(objectId, details) {
  const data = load();
  data[String(objectId)] = details;
  saveAll(data);
}

function invalidateCache() {
  cached = null;
}

module.exports = {
  getDetailsByObjectId,
  updateDetailsByObjectId,
  invalidateCache,
  load,
};
