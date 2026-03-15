export type PromiseStatus = 'good' | 'mixed' | 'bad' | 'unverified';
export type ObjectType = 'school' | 'hospital' | 'kindergarten' | 'sport' | 'university' | 'road';

export interface InfraPromise {
  id: string;
  title: string;
  confirmed: number;
  reported: number;
  status: string;
}

export interface Category {
  title: string;
  promises: InfraPromise[];
}

export interface Observation {
  id: string;
  category: string;
  text: string;
  time: string;
  photos: string[];
  priority: number;
}

export interface InfraObject {
  id: number;
  name: string;
  type: ObjectType;
  address: string;
  status: PromiseStatus;
  coords: [number, number];
  image: string;
  established?: number;
  district?: string;
  capitalRepair?: string;
  /** Svet (elektr) — наличие света */
  light?: boolean;
  water?: boolean;
  internet?: boolean;
  summary: string;
  totalInspections: number;
  promiseCount: number;
  categories: Category[];
  observations: Observation[];
  /** Set by map API when requested with lat/lng (meters from user). */
  distanceMeters?: number;
}

export const INFRASTRUCTURE_OBJECTS: InfraObject[] = [
  {
    id: 1,
    name: "94-sonli umumiy o'rta ta'lim maktabi",
    type: 'school',
    address: "Toshkent sh, Mirobod",
    status: "mixed",
    coords: [41.2995, 69.2401],
    image: "https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&w=600&q=80",
    established: 1933,
    district: "Mirobod",
    capitalRepair: "2018",
    water: true,
    internet: true,
    summary: "Bino eski, ammo suv va internet mavjud. Sanitariya holatiga shikoyatlar bor.",
    totalInspections: 27,
    promiseCount: 5,
    categories: [
      {
        title: "Sanitariya",
        promises: [
          { id: 'p1', title: "Yangi sovun dispenserlari", confirmed: 45, reported: 38, status: "Aralash fikrlar" },
          { id: 'p2', title: "Sensorsiz jo'mraklar", confirmed: 82, reported: 2, status: "Tasdiqlangan" },
        ]
      },
      {
        title: "Jihozlar",
        promises: [
          { id: 'p3', title: "Interaktiv doskalar", confirmed: 12, reported: 40, status: "Muammolar aniqlangan" },
        ]
      },
      {
        title: "Ta'mirlash",
        promises: [
          { id: 'p4', title: "Tom ta'miri", confirmed: 60, reported: 5, status: "Tasdiqlangan" },
          { id: 'p5', title: "Derazalar almashinuvi", confirmed: 30, reported: 25, status: "Aralash fikrlar" },
        ]
      }
    ],
    observations: [
      { id: 'o1', category: "Sanitariya", text: "2-qavat hojatxonasida suv oqmayapti.", time: "2 soat oldin", photos: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80"], priority: 3 },
      { id: 'o2', category: "Jihozlar", text: "3B sinfdagi interaktiv doska ishlamayapti.", time: "5 soat oldin", photos: ["https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=300&q=80"], priority: 2 },
      { id: 'o3', category: "Ta'mirlash", text: "Sport zal tomidan suv oqmoqda.", time: "1 kun oldin", photos: [], priority: 3 },
      { id: 'o4', category: "Sanitariya", text: "1-qavat yo'lagida axlat yig'ilib qolgan.", time: "2 kun oldin", photos: ["https://images.unsplash.com/photo-1532996122724-e3db411a4abc?auto=format&fit=crop&w=300&q=80"], priority: 1 },
    ]
  },
  {
    id: 2,
    name: "Markaziy shifoxona",
    type: 'hospital',
    address: "Toshkent sh, Yunusobod",
    status: "good",
    coords: [41.3110, 69.2790],
    image: "https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=600&q=80",
    established: 2007,
    district: "Yunusobod",
    capitalRepair: "2022",
    water: true,
    internet: true,
    summary: "Zamonaviy shifoxona, jihozlar yaxshi holatda.",
    totalInspections: 45,
    promiseCount: 2,
    categories: [
      {
        title: "Tibbiy jihozlar",
        promises: [
          { id: 'p6', title: "MRT apparati", confirmed: 95, reported: 3, status: "Tasdiqlangan" },
          { id: 'p7', title: "Reanimatsiya jihozlari", confirmed: 78, reported: 8, status: "Tasdiqlangan" },
        ]
      }
    ],
    observations: [
      { id: 'o5', category: "Xizmat", text: "Navbat juda uzoq, 3 soatdan ko'p kutdim.", time: "3 soat oldin", photos: [], priority: 2 },
    ]
  },
  {
    id: 3,
    name: "21-sonli bolalar bog'chasi",
    type: 'kindergarten',
    address: "Toshkent sh, Chilonzor",
    status: "bad",
    coords: [41.2860, 69.2100],
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=600&q=80",
    established: 1985,
    district: "Chilonzor",
    capitalRepair: "Yo'q",
    water: false,
    internet: false,
    summary: "Jiddiy muammolar mavjud. Xavfsizlik to'siqlari buzilgan.",
    totalInspections: 12,
    promiseCount: 2,
    categories: [
      {
        title: "Xavfsizlik",
        promises: [
          { id: 'p8', title: "O'yin maydoni to'siqlari", confirmed: 5, reported: 55, status: "Jiddiy muammolar" },
          { id: 'p9', title: "Kuzatuv kameralari", confirmed: 10, reported: 42, status: "Muammolar aniqlangan" },
        ]
      }
    ],
    observations: [
      { id: 'o6', category: "Xavfsizlik", text: "O'yin maydonidagi temir to'siq singan!", time: "1 soat oldin", photos: ["https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?auto=format&fit=crop&w=300&q=80"], priority: 3 },
      { id: 'o7', category: "Xavfsizlik", text: "Kuzatuv kameralari 2 haftadan beri ishlamayapti.", time: "3 kun oldin", photos: [], priority: 2 },
    ]
  },
  {
    id: 4,
    name: "Sport majmuasi",
    type: 'sport',
    address: "Toshkent sh, Sergeli",
    status: "good",
    coords: [41.2550, 69.3200],
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80",
    established: 2019,
    district: "Sergeli",
    capitalRepair: "2023",
    water: true,
    internet: true,
    summary: "Yangi sport majmuasi, barcha jihozlar ishlaydi.",
    totalInspections: 18,
    promiseCount: 1,
    categories: [
      {
        title: "Jihozlar",
        promises: [
          { id: 'p10', title: "Suzish havzasi filtratsiyasi", confirmed: 88, reported: 4, status: "Tasdiqlangan" },
        ]
      }
    ],
    observations: []
  },
];
