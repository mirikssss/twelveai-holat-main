/**
 * Deterministic fallback values for map objects. Same id/type/name => same values.
 * No random; stable across restarts for hackathon demo.
 */

const DISTRICTS = [
  'Yunusobod',
  'Chilonzor',
  'Mirobod',
  'Sergeli',
  'Shayxontohur',
  'Olmazor',
  'Bektemir',
  'Yakkasaray',
  'Uchtepa',
];

const SUMMARIES = [
  "Obyekt bo'yicha ma'lumotlar qisman tasdiqlangan.",
  "Fuqarolar tekshiruvi hali yetarli emas.",
  "Obyekt bo'yicha ayrim muammolar qayd etilgan.",
  "Tekshiruv davom etmoqda.",
  "Asosiy ko'rsatkichlar yig'ilmoqda.",
  "Ma'lumotlar yangilanmoqda.",
  "Obyekt monitoring reestrida.",
  "Qisqa tavsif hozircha cheklangan.",
  "Tekshiruvlar natijasiga ko'ra holat barqaror.",
  "Yaqinda yangilanishi kutilmoqda.",
];

// Distribute statuses: at least 1-2 good, 1-2 bad, 1-2 mixed, rest unverified.
// id 1,2 -> good; 3,4 -> bad; 5,6 -> mixed; 7,8,9,10 -> unverified
const STATUS_BY_ID = {
  1: 'good',
  2: 'good',
  3: 'bad',
  4: 'bad',
  5: 'mixed',
  6: 'mixed',
  7: 'unverified',
  8: 'unverified',
  9: 'unverified',
  10: 'unverified',
};

function seedFromId(id) {
  const n = Number(id);
  return Number.isNaN(n) ? 0 : n;
}

function getDistrict(id) {
  const idx = seedFromId(id) % DISTRICTS.length;
  return DISTRICTS[idx];
}

function getAddress(id) {
  const district = getDistrict(id);
  return `Toshkent sh., ${district} tumani`;
}

function getStatus(id) {
  return STATUS_BY_ID[seedFromId(id)] || 'unverified';
}

function getSummary(id) {
  const idx = seedFromId(id) % SUMMARIES.length;
  return SUMMARIES[idx];
}

function getEstablished(id) {
  // 1970..2015
  const base = 1970 + (seedFromId(id) * 37) % 46;
  return Math.min(2015, Math.max(1970, base));
}

function getCapitalRepair(id) {
  const established = getEstablished(id);
  // ~half have capital repair year after established
  if (seedFromId(id) % 2 === 0) return null;
  const year = established + 5 + (seedFromId(id) * 11) % 21;
  return String(Math.min(2024, year));
}

function getWater(id) {
  return seedFromId(id) % 2 === 0;
}

function getInternet(id) {
  return seedFromId(id) % 3 !== 0;
}

function getLight(id) {
  return seedFromId(id) % 4 !== 0;
}

function getTotalInspections(id) {
  return (seedFromId(id) * 7) % 61;
}

function getPromiseCount(id) {
  return 2 + (seedFromId(id) % 7); // 2..8
}

/**
 * Returns fallback fields for a raw object (with id, type, name).
 * Only fills in what's missing; does not overwrite existing non-empty values.
 */
function getFallbacks(raw) {
  const id = raw.id;
  return {
    district: raw.district ?? getDistrict(id),
    address: raw.address ?? getAddress(id),
    status: raw.status ?? getStatus(id),
    summary: raw.summary ?? getSummary(id),
    established: raw.established ?? getEstablished(id),
    capitalRepair: raw.capitalRepair ?? getCapitalRepair(id),
    light: typeof raw.light === 'boolean' ? raw.light : getLight(id),
    water: typeof raw.water === 'boolean' ? raw.water : getWater(id),
    internet: typeof raw.internet === 'boolean' ? raw.internet : getInternet(id),
    totalInspections:
      typeof raw.totalInspections === 'number' && raw.totalInspections >= 0
        ? raw.totalInspections
        : getTotalInspections(id),
    promiseCount:
      typeof raw.promiseCount === 'number' && raw.promiseCount >= 0
        ? raw.promiseCount
        : getPromiseCount(id),
  };
}

module.exports = {
  getFallbacks,
};
