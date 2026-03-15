/**
 * Seed object-details.json with rich data for schools: categories, promises, observations.
 * Run from backend: node scripts/seed-school-details.js
 */
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'object-details.json');

const SCHOOL_DETAILS = {
  3: {
    categories: [
      {
        id: 'cat-3-infra',
        title: 'Infratuzilma',
        promises: [
          { id: 'promise-3-1', title: "Tom ta'miri", statusCode: 'attention', confirmedCount: 5, reportedCount: 12 },
          { id: 'promise-3-2', title: "Suv ta'minoti", statusCode: 'mixed', confirmedCount: 8, reportedCount: 6 },
          { id: 'promise-3-3', title: "Elektr tarmoqlari", statusCode: 'confirmed', confirmedCount: 45, reportedCount: 2 },
        ],
      },
      {
        id: 'cat-3-talim',
        title: "Ta'lim muhiti",
        promises: [
          { id: 'promise-3-4', title: "Interaktiv doskalar", statusCode: 'unchecked', confirmedCount: 0, reportedCount: 0 },
          { id: 'promise-3-5', title: "Darsxonalar ta'miri", statusCode: 'mixed', confirmedCount: 20, reportedCount: 15 },
        ],
      },
    ],
    observations: [
      { id: 'obs-3-1', category: 'Suv', text: "Suv bosimi juda past, 2-qavatda yo'q.", createdAt: '2026-03-15T08:00:00.000Z', updatedAt: '2026-03-15T08:00:00.000Z', photos: [], priority: 3, status: 'confirmed', userPhone: null, userName: null, confirmedAt: '2026-03-15T09:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-3-2', category: 'Sanitariya', text: "Hojatxonalar iflos, tozalash kerak.", createdAt: '2026-03-14T11:00:00.000Z', updatedAt: '2026-03-14T11:00:00.000Z', photos: [], priority: 2, status: 'in_resolution', userPhone: '998901234567', userName: 'Sardor', confirmedAt: '2026-03-14T12:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-3-3', category: 'Infratuzilma', text: "Sport zal tomidan suv oqmoqda.", createdAt: '2026-03-13T16:00:00.000Z', updatedAt: '2026-03-14T10:00:00.000Z', photos: [], priority: 2, status: 'resolved', userPhone: null, userName: null, confirmedAt: '2026-03-13T17:00:00.000Z', resolvedAt: '2026-03-14T10:00:00.000Z', rejectedAt: null },
    ],
  },
  4: {
    categories: [
      {
        id: 'cat-4-jihozlar',
        title: 'Jihozlar',
        promises: [
          { id: 'promise-4-1', title: "Interaktiv doskalar", statusCode: 'mixed', confirmedCount: 30, reportedCount: 20 },
          { id: 'promise-4-2', title: "Kompyuterlar sinfi", statusCode: 'confirmed', confirmedCount: 55, reportedCount: 3 },
          { id: 'promise-4-3', title: "Laboratoriya jihozlari", statusCode: 'unchecked', confirmedCount: 0, reportedCount: 0 },
        ],
      },
      {
        id: 'cat-4-binolar',
        title: "Bino va xonalar",
        promises: [
          { id: 'promise-4-4', title: "Kapital ta'mir", statusCode: 'attention', confirmedCount: 4, reportedCount: 18 },
        ],
      },
    ],
    observations: [
      { id: 'obs-4-1', category: 'Internet / Aloqa', text: "Wi-Fi ishlamayapti 3-qavatda.", createdAt: '2026-03-15T09:30:00.000Z', updatedAt: '2026-03-15T09:30:00.000Z', photos: [], priority: 2, status: 'confirmed', userPhone: null, userName: null, confirmedAt: '2026-03-15T10:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-4-2', category: 'Navbat / Xizmat sifati', text: "Ona-bolalar uchun navbat uzoq.", createdAt: '2026-03-14T08:00:00.000Z', updatedAt: '2026-03-14T08:00:00.000Z', photos: [], priority: 1, status: 'pending', userPhone: '998901234567', userName: 'Sardor', confirmedAt: null, resolvedAt: null, rejectedAt: null },
    ],
  },
  5: {
    categories: [
      {
        id: 'cat-5-xavfsizlik',
        title: 'Xavfsizlik',
        promises: [
          { id: 'promise-5-1', title: "Kuzatuv kameralari", statusCode: 'confirmed', confirmedCount: 70, reportedCount: 5 },
          { id: 'promise-5-2', title: "Kirish nazorati", statusCode: 'mixed', confirmedCount: 25, reportedCount: 12 },
        ],
      },
      {
        id: 'cat-5-sport',
        title: 'Sport inshootlari',
        promises: [
          { id: 'promise-5-3', title: "Sport maydonchasi", statusCode: 'confirmed', confirmedCount: 40, reportedCount: 0 },
          { id: 'promise-5-4', title: "Basseyn ta'miri", statusCode: 'unchecked', confirmedCount: 0, reportedCount: 0 },
        ],
      },
    ],
    observations: [
      { id: 'obs-5-1', category: 'Svet', text: "Ba'zi darsxonalarda chiroq ishlamayapti.", createdAt: '2026-03-15T07:00:00.000Z', updatedAt: '2026-03-15T07:00:00.000Z', photos: [], priority: 2, status: 'confirmed', userPhone: null, userName: null, confirmedAt: '2026-03-15T08:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-5-2', category: 'Sanitariya', text: "Oshxona tozaligi yetarli emas.", createdAt: '2026-03-13T12:00:00.000Z', updatedAt: '2026-03-14T14:00:00.000Z', photos: [], priority: 3, status: 'in_resolution', userPhone: null, userName: null, confirmedAt: '2026-03-13T13:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-5-3', category: 'Suv', text: "Ichimlik suvi mavjud emas 1-qavatda.", createdAt: '2026-03-12T10:00:00.000Z', updatedAt: '2026-03-12T10:00:00.000Z', photos: [], priority: 2, status: 'resolved', userPhone: null, userName: null, confirmedAt: '2026-03-12T11:00:00.000Z', resolvedAt: '2026-03-13T09:00:00.000Z', rejectedAt: null },
    ],
  },
  11: {
    categories: [
      {
        id: 'cat-11-talim',
        title: "Ta'lim va jihozlar",
        promises: [
          { id: 'promise-11-1', title: "Yangi kompyuterlar", statusCode: 'confirmed', confirmedCount: 62, reportedCount: 4 },
          { id: 'promise-11-2', title: "Interaktiv doskalar", statusCode: 'mixed', confirmedCount: 28, reportedCount: 19 },
          { id: 'promise-11-3', title: "Kutubxona zali", statusCode: 'confirmed', confirmedCount: 48, reportedCount: 2 },
        ],
      },
      {
        id: 'cat-11-infra',
        title: 'Infratuzilma',
        promises: [
          { id: 'promise-11-4', title: "Suv ta'minoti", statusCode: 'attention', confirmedCount: 3, reportedCount: 22 },
          { id: 'promise-11-5', title: "Isitish tizimi", statusCode: 'unchecked', confirmedCount: 0, reportedCount: 0 },
        ],
      },
    ],
    observations: [
      { id: 'obs-11-1', category: 'Suv', text: "2 va 3-qavatda suv kam, o'quvchilar navbatda turadi.", createdAt: '2026-03-15T10:00:00.000Z', updatedAt: '2026-03-15T10:00:00.000Z', photos: [], priority: 3, status: 'confirmed', userPhone: null, userName: null, confirmedAt: '2026-03-15T11:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-11-2', category: 'Internet / Aloqa', text: "Wi-Fi seanslar tez-tez uziladi.", createdAt: '2026-03-14T14:00:00.000Z', updatedAt: '2026-03-14T14:00:00.000Z', photos: [], priority: 2, status: 'in_resolution', userPhone: '998901234567', userName: 'Sardor', confirmedAt: '2026-03-14T15:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-11-3', category: 'Sanitariya', text: "Hojatxonalar toza, lekin sovun dispenserlari bo'sh.", createdAt: '2026-03-13T09:00:00.000Z', updatedAt: '2026-03-13T12:00:00.000Z', photos: [], priority: 1, status: 'resolved', userPhone: null, userName: null, confirmedAt: '2026-03-13T10:00:00.000Z', resolvedAt: '2026-03-13T12:00:00.000Z', rejectedAt: null },
    ],
  },
  12: {
    categories: [
      {
        id: 'cat-12-binolar',
        title: "Bino va ta'mir",
        promises: [
          { id: 'promise-12-1', title: "Fasadvagi yoriqlar", statusCode: 'mixed', confirmedCount: 15, reportedCount: 11 },
          { id: 'promise-12-2', title: "Tom ta'miri", statusCode: 'confirmed', confirmedCount: 38, reportedCount: 5 },
          { id: 'promise-12-3', title: "Derazalar almashtirish", statusCode: 'unchecked', confirmedCount: 0, reportedCount: 0 },
        ],
      },
      {
        id: 'cat-12-xavfsizlik',
        title: 'Xavfsizlik',
        promises: [
          { id: 'promise-12-4', title: "Yong'in xavfsizligi", statusCode: 'confirmed', confirmedCount: 72, reportedCount: 1 },
        ],
      },
    ],
    observations: [
      { id: 'obs-12-1', category: 'Infratuzilma', text: "Asosiy kirish eshigida polda yoriq bor.", createdAt: '2026-03-15T08:00:00.000Z', updatedAt: '2026-03-15T08:00:00.000Z', photos: [], priority: 2, status: 'confirmed', userPhone: null, userName: null, confirmedAt: '2026-03-15T09:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-12-2', category: 'Svet', text: "Yo'lqchi chiroqlari ishlamayapti kechqurun.", createdAt: '2026-03-14T16:00:00.000Z', updatedAt: '2026-03-14T16:00:00.000Z', photos: [], priority: 2, status: 'pending', userPhone: null, userName: null, confirmedAt: null, resolvedAt: null, rejectedAt: null },
      { id: 'obs-12-3', category: 'Elektr', text: "3-qavatda rozetkalar ishlamayapti.", createdAt: '2026-03-13T11:00:00.000Z', updatedAt: '2026-03-14T08:00:00.000Z', photos: [], priority: 3, status: 'in_resolution', userPhone: null, userName: null, confirmedAt: '2026-03-13T12:00:00.000Z', resolvedAt: null, rejectedAt: null },
      { id: 'obs-12-4', category: 'Navbat / Xizmat sifati', text: "Direktor qabuliga yozilish qiyin.", createdAt: '2026-03-12T09:00:00.000Z', updatedAt: '2026-03-12T09:00:00.000Z', photos: [], priority: 1, status: 'resolved', userPhone: null, userName: null, confirmedAt: '2026-03-12T10:00:00.000Z', resolvedAt: '2026-03-13T14:00:00.000Z', rejectedAt: null },
    ],
  },
};

function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  for (const [key, details] of Object.entries(SCHOOL_DETAILS)) {
    data[key] = details;
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log('Updated object-details for schools:', Object.keys(SCHOOL_DETAILS).join(', '));
}

main();
