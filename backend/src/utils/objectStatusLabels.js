/**
 * Map object status (good/mixed/bad/unverified) to { code, label } for object page.
 * code: attention | checking | confirmed
 * label: Muammoli | Tekshiruvda | Tasdiqlangan
 */
const OBJECT_STATUS_MAP = {
  good: { code: 'confirmed', label: 'Tasdiqlangan' },
  mixed: { code: 'checking', label: 'Tekshiruvda' },
  bad: { code: 'attention', label: 'Muammoli' },
  unverified: { code: 'checking', label: 'Tekshirilmagan' },
};

function getObjectStatus(status) {
  const normalized = (status && typeof status === 'string') ? status.toLowerCase() : 'unverified';
  return OBJECT_STATUS_MAP[normalized] || OBJECT_STATUS_MAP.unverified;
}

module.exports = { getObjectStatus };
