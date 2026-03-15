/**
 * Recalculate overall object status from all promise item statusCodes.
 * Returns one of: good | mixed | bad | unverified
 */
function calcObjectStatus(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return 'unverified';

  const allCodes = [];
  for (const cat of categories) {
    if (!Array.isArray(cat.promises)) continue;
    for (const p of cat.promises) {
      allCodes.push(p.statusCode || 'unchecked');
    }
  }

  if (allCodes.length === 0) return 'unverified';

  if (allCodes.some((c) => c === 'attention')) return 'bad';
  if (allCodes.some((c) => c === 'mixed' || c === 'unchecked')) return 'mixed';
  if (allCodes.every((c) => c === 'confirmed')) return 'good';

  return 'mixed';
}

module.exports = { calcObjectStatus };
