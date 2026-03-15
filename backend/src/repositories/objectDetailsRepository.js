const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '..', '..', 'data', 'object-details.json');

let cached = null;

function load() {
  if (cached) return cached;
  if (!fs.existsSync(DATA_PATH)) {
    cached = {};
    return cached;
  }
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    cached = JSON.parse(raw);
    return cached && typeof cached === 'object' ? cached : {};
  } catch {
    cached = {};
    return cached;
  }
}

function getDetailsByObjectId(objectId) {
  const data = load();
  const key = String(objectId);
  return data[key] || null;
}

module.exports = {
  getDetailsByObjectId,
  load,
};
