const fs = require('fs');
const path = require('path');

const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DATA = path.resolve(__dirname, '..', '..', 'data');
const TMP_DATA = '/tmp/holat-data';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Get readable path. On Vercel: copies bundled file to /tmp on first access.
 */
function resolveReadPath(relativePath) {
  if (!IS_VERCEL) return path.join(BUNDLED_DATA, relativePath);

  const tmpPath = path.join(TMP_DATA, relativePath);
  if (fs.existsSync(tmpPath)) return tmpPath;

  const bundled = path.join(BUNDLED_DATA, relativePath);
  if (fs.existsSync(bundled)) {
    ensureDir(path.dirname(tmpPath));
    fs.copyFileSync(bundled, tmpPath);
  }
  return tmpPath;
}

/**
 * Get writable path. On Vercel: always in /tmp.
 */
function resolveWritePath(relativePath) {
  if (!IS_VERCEL) return path.join(BUNDLED_DATA, relativePath);

  const tmpPath = path.join(TMP_DATA, relativePath);
  ensureDir(path.dirname(tmpPath));

  if (!fs.existsSync(tmpPath)) {
    const bundled = path.join(BUNDLED_DATA, relativePath);
    if (fs.existsSync(bundled)) fs.copyFileSync(bundled, tmpPath);
  }
  return tmpPath;
}

module.exports = { resolveReadPath, resolveWritePath, IS_VERCEL };
