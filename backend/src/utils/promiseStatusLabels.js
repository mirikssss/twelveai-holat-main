/**
 * Map promise statusCode to { code, label } for object page.
 * statusCode: confirmed | unchecked | mixed | attention
 */
const PROMISE_STATUS_MAP = {
  confirmed: { code: 'confirmed', label: 'Tasdiqlangan' },
  unchecked: { code: 'unchecked', label: "Tekshirilmagan" },
  mixed: { code: 'mixed', label: 'Aralash fikrlar' },
  attention: { code: 'attention', label: 'Muammoli' },
};

function getPromiseStatus(statusCode) {
  const normalized = (statusCode && typeof statusCode === 'string') ? statusCode.toLowerCase() : 'unchecked';
  return PROMISE_STATUS_MAP[normalized] || PROMISE_STATUS_MAP.unchecked;
}

module.exports = { getPromiseStatus };
