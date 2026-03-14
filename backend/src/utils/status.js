const VALID_STATUSES = ['good', 'mixed', 'bad', 'unverified'];

/**
 * For now keep everything as 'unverified' unless an explicit valid status is provided.
 * This makes it easy to plug in smarter logic later.
 */
const deriveStatus = (rawStatus) => {
  if (typeof rawStatus === 'string' && VALID_STATUSES.includes(rawStatus)) {
    return rawStatus;
  }
  return 'unverified';
};

module.exports = {
  VALID_STATUSES,
  deriveStatus,
};

