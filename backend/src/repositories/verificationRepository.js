const fs = require('fs');
const { resolveWritePath } = require('../utils/dataPath');

function getPath() {
  return resolveWritePath('verifications.json');
}

function load() {
  const p = getPath();
  if (!fs.existsSync(p)) return [];
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(verifications) {
  fs.writeFileSync(getPath(), JSON.stringify(verifications, null, 2), 'utf8');
}

function addVerification(entry) {
  const list = load();
  list.push(entry);
  save(list);
  return entry;
}

module.exports = { load, addVerification };
