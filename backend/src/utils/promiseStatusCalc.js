/**
 * Recalculate promise item statusCode from confirmedCount / reportedCount.
 * Returns one of: confirmed | unchecked | mixed | attention
 */
function calcPromiseStatusCode(confirmedCount, reportedCount) {
  const total = confirmedCount + reportedCount;

  if (total === 0) return 'unchecked';

  if (confirmedCount >= 3 && reportedCount === 0) return 'confirmed';
  if (reportedCount >= 3 && reportedCount > confirmedCount) return 'attention';
  if (confirmedCount > reportedCount && confirmedCount >= 2) return 'confirmed';
  if (reportedCount > confirmedCount && reportedCount >= 2) return 'attention';

  if (confirmedCount > 0 && reportedCount > 0) return 'mixed';

  return confirmedCount > 0 ? 'confirmed' : 'attention';
}

module.exports = { calcPromiseStatusCode };
