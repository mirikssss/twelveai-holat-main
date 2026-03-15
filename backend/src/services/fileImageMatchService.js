const fs = require('fs');
const path = require('path');

const PUBLIC_ROOT = path.resolve(__dirname, '..', '..', 'public');

const TYPE_DIR_MAP = {
  school: 'schools',
  university: 'universities',
  medical: 'medical',
};

const normalizeName = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/№/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-zа-яё0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const scoreMatch = (needle, candidate) => {
  if (!needle || !candidate) return 0;
  if (needle === candidate) return 1.0;
  if (candidate.includes(needle)) return 0.9;
  if (needle.includes(candidate)) return 0.8;

  const nTokens = needle.split(' ').filter(Boolean);
  const cTokens = candidate.split(' ').filter(Boolean);
  const common = nTokens.filter((t) => cTokens.includes(t));
  if (!common.length) return 0;
  return common.length / Math.max(nTokens.length, 1);
};

/**
 * Find image for object. Names match: file name (without extension) = object name
 * (normalized: lower case, no №, no parentheses, single spaces).
 */
const findBestImageForObject = (obj) => {
  const dirName = TYPE_DIR_MAP[obj.type];
  if (!dirName) return '';

  const dirPath = path.join(PUBLIC_ROOT, dirName);
  if (!fs.existsSync(dirPath)) return '';

  const files = fs
    .readdirSync(dirPath)
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

  if (!files.length) return '';

  const targetNorm = normalizeName(obj.name);

  // 1) Exact normalized match: file base name (no extension) equals object name
  for (const file of files) {
    const base = path.parse(file).name;
    if (normalizeName(base) === targetNorm) return `/${dirName}/${file}`;
  }

  // 2) Object name is contained in file name or vice versa (normalized)
  for (const file of files) {
    const base = path.parse(file).name;
    const fileNorm = normalizeName(base);
    if (targetNorm && fileNorm && (fileNorm.includes(targetNorm) || targetNorm.includes(fileNorm)))
      return `/${dirName}/${file}`;
  }

  // 3) Best fuzzy score
  let bestFile = '';
  let bestScore = 0;
  for (const file of files) {
    const base = path.parse(file).name;
    const norm = normalizeName(base);
    const score = scoreMatch(targetNorm, norm);
    if (score > bestScore) {
      bestScore = score;
      bestFile = file;
    }
  }
  if (bestFile && bestScore >= 0.25) return `/${dirName}/${bestFile}`;

  // 4) For schools: if no match, assign different image per object (by id) so no two schools share the same photo
  if (dirName === 'schools' && files.length > 0) {
    const sorted = [...files].sort();
    const index = Number(obj.id) && !Number.isNaN(Number(obj.id))
      ? (Number(obj.id) - 1) % sorted.length
      : (obj.name || '').length % sorted.length;
    return `/${dirName}/${sorted[index]}`;
  }

  return '';
};

module.exports = {
  findBestImageForObject,
};

