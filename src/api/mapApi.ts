/**
 * Map/Discovery screen API. Backend must be running (e.g. http://localhost:4000).
 * Set VITE_API_URL in .env for dev if frontend runs on different port.
 */

import type { InfraObject, PromiseStatus } from '@/data/infrastructure';

const RAW_BASE = (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) || '';
const BASE = RAW_BASE.replace(/\/+$/, '');

/** Prefix relative asset paths (e.g. /medical/photo.jpg) with backend origin so images load in production. */
function assetUrl(path: string): string {
  if (!path || !BASE) return path;
  if (path.startsWith('http')) return path;
  return `${BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

export type MapObjectType = 'school' | 'university' | 'medical';
export type MapObjectStatus = PromiseStatus;

export interface MapObject {
  id: number;
  externalId: string | null;
  name: string;
  type: MapObjectType;
  coords: [number, number];
  image: string;
  district: string | null;
  address: string | null;
  status: MapObjectStatus;
  summary: string;
  established: number | null;
  capitalRepair: string | null;
  light?: boolean;
  water: boolean | null;
  internet: boolean | null;
  totalInspections: number;
  promiseCount: number;
  categories?: unknown[];
  observations?: unknown[];
  distanceMeters?: number;
}

export interface MapObjectsParams {
  q?: string;
  /** Backend accepts: school | university | medical. Use typeForApi() when passing frontend type. */
  type?: string;
  status?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

/** Frontend filter type (e.g. hospital) -> backend type (medical). */
export function typeForApi(frontendType: string): string {
  if (frontendType === 'hospital') return 'medical';
  return frontendType;
}

/** Backend type "medical" -> frontend "hospital" for filters/UI. */
function mapApiTypeToFrontend(type: string): InfraObject['type'] {
  if (type === 'medical') return 'hospital';
  if (type === 'school' || type === 'university') return type;
  return 'school';
}

/** Convert API response item to InfraObject for components. */
export function toInfraObject(m: MapObject): InfraObject {
  return {
    id: m.id,
    name: m.name,
    type: mapApiTypeToFrontend(m.type),
    address: m.address ?? '',
    status: m.status,
    coords: m.coords,
    image: assetUrl(m.image) || '',
    established: m.established ?? undefined,
    district: m.district ?? undefined,
    capitalRepair: m.capitalRepair ?? undefined,
    light: m.light ?? undefined,
    water: m.water ?? undefined,
    internet: m.internet ?? undefined,
    summary: m.summary,
    totalInspections: m.totalInspections,
    promiseCount: m.promiseCount,
    categories: Array.isArray(m.categories) ? m.categories : [],
    observations: Array.isArray(m.observations) ? m.observations : [],
    distanceMeters: m.distanceMeters,
  };
}

export async function fetchMapObjects(params: MapObjectsParams = {}): Promise<MapObject[]> {
  const search = new URLSearchParams();
  if (params.q) search.set('q', params.q);
  if (params.type) search.set('type', params.type);
  if (params.status) search.set('status', params.status);
  if (params.lat != null) search.set('lat', String(params.lat));
  if (params.lng != null) search.set('lng', String(params.lng));
  if (params.radius != null) search.set('radius', String(params.radius));

  const url = `${BASE}/api/map/objects${search.toString() ? `?${search}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Map API error: ${res.status}`);
  return res.json();
}

/** Response shape from GET /api/map/objects/:id (object detail page). */
export interface ObjectDetailResponse {
  id: number;
  name: string;
  type: string;
  image: string;
  district: string | null;
  address: string | null;
  coords: { lat: number; lng: number };
  objectStatus: { code: string; label: string };
  passport: { established: number | null; capitalRepair: string | null; light: string; water: string; internet: string };
  summary: string;
  totalInspections?: number;
  promiseCount?: number;
  latestObservation: unknown;
  newObservationsCount: number;
  categories: Array<{
    id: string;
    title: string;
    itemsCount: number;
    promises: Array<{
      id: string;
      title: string;
      status: { code: string; label: string };
      confirmedCount: number;
      reportedCount: number;
    }>;
  }>;
  observations: Array<{
    id: string;
    category: string;
    text: string;
    createdAt: string;
    timeLabel: string;
    photos: string[];
    priority: number;
    status?: string;
  }>;
}

/** Fetch full object detail for ObjectSheet (categories, observations). */
export async function fetchObjectDetail(id: number): Promise<ObjectDetailResponse> {
  const res = await fetch(`${BASE}/api/map/objects/${id}`);
  if (!res.ok) throw new Error(`Object detail error: ${res.status}`);
  return res.json();
}

// ---- Verification submit ----

export interface SubmitVerificationBody {
  programItemId: string;
  verdict: 'confirmed' | 'issue';
  comment?: string;
  photo: string;
  userLocation: { lat: number; lng: number };
}

export interface SubmitVerificationResponse {
  success: boolean;
  message: string;
  verification: {
    id: string;
    objectId: number;
    programItemId: string;
    verdict: string;
    geoVerified: boolean;
    distanceToObjectMeters: number;
    createdAt: string;
  };
  updatedPromiseItem: {
    id: string;
    title: string;
    status: { code: string; label: string };
    confirmedCount: number;
    reportedCount: number;
  };
  updatedObjectStatus: { code: string; label: string };
}

export interface VerificationError {
  error: string;
  message?: string;
  distanceToObjectMeters?: number;
}

export async function submitVerification(
  objectId: number,
  body: SubmitVerificationBody
): Promise<SubmitVerificationResponse> {
  const res = await fetch(`${BASE}/api/objects/${objectId}/verifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: VerificationError = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw err;
  }
  return res.json();
}

// ---- Observation submit ----

export interface SubmitObservationBody {
  category: string;
  text: string;
  photo: string;
  userLocation: { lat: number; lng: number };
  userPhone?: string;
  userName?: string;
}

export interface UserObservation {
  id: string;
  objectId: number;
  objectName: string;
  category: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  timeLabel: string;
  photos: string[];
  priority: number;
  status: string;
  confirmedAt: string | null;
  resolvedAt: string | null;
  rejectedAt: string | null;
}

export async function fetchUserObservations(phone: string): Promise<UserObservation[]> {
  const res = await fetch(`${BASE}/api/users/${encodeURIComponent(phone)}/observations`);
  if (!res.ok) throw new Error(`User observations error: ${res.status}`);
  const data: UserObservation[] = await res.json();
  return data.map((obs) => ({
    ...obs,
    photos: (obs.photos || []).map(assetUrl),
  }));
}

export interface SubmitObservationResponse {
  success: boolean;
  message: string;
  observation: {
    id: string;
    category: string;
    text: string;
    createdAt: string;
    timeLabel: string;
    photos: string[];
    priority: number;
  };
  objectId: number;
  newObservationsCount: number;
}

export async function submitObservation(
  objectId: number,
  body: SubmitObservationBody
): Promise<SubmitObservationResponse> {
  const res = await fetch(`${BASE}/api/objects/${objectId}/observations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: VerificationError = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw err;
  }
  return res.json();
}

/** Map objectStatus.code to frontend PromiseStatus. */
function detailStatusToPromiseStatus(code: string): PromiseStatus {
  if (code === 'confirmed') return 'good';
  if (code === 'attention') return 'bad';
  if (code === 'checking') return 'mixed';
  return 'unverified';
}

/** Convert object detail API response to InfraObject for ObjectSheet. */
export function detailResponseToInfraObject(d: ObjectDetailResponse): InfraObject {
  const coords: [number, number] = [
    d.coords?.lat ?? 0,
    d.coords?.lng ?? 0,
  ];
  return {
    id: d.id,
    name: d.name,
    type: mapApiTypeToFrontend(d.type),
    address: d.address ?? '',
    status: detailStatusToPromiseStatus(d.objectStatus?.code ?? ''),
    coords,
    image: assetUrl(d.image ?? ''),
    established: d.passport?.established ?? undefined,
    district: d.district ?? undefined,
    capitalRepair: d.passport?.capitalRepair ?? undefined,
    light: d.passport?.light === 'Bor',
    water: d.passport?.water === 'Bor',
    internet: d.passport?.internet === 'Bor',
    summary: d.summary ?? '',
    totalInspections: d.totalInspections ?? 0,
    promiseCount: d.promiseCount ?? 0,
    categories: (d.categories ?? []).map((cat) => ({
      title: cat.title,
      promises: (cat.promises ?? []).map((p) => ({
        id: p.id,
        title: p.title,
        confirmed: p.confirmedCount ?? 0,
        reported: p.reportedCount ?? 0,
        status: p.status?.label ?? '',
      })),
    })),
    observations: (d.observations ?? []).map((obs) => ({
      id: obs.id,
      category: obs.category,
      text: obs.text,
      time: obs.timeLabel ?? '',
      photos: (obs.photos ?? []).map(assetUrl),
      priority: obs.priority ?? 0,
      status: obs.status || 'confirmed',
    })),
    latestObservation:
      d.latestObservation && typeof d.latestObservation === 'object'
        ? {
            id: (d.latestObservation as { id?: string }).id ?? '',
            category: (d.latestObservation as { category?: string }).category ?? '',
            text: (d.latestObservation as { text?: string }).text ?? '',
            time: (d.latestObservation as { timeLabel?: string }).timeLabel ?? '',
            photos: Array.isArray((d.latestObservation as { photos?: string[] }).photos)
              ? (d.latestObservation as { photos: string[] }).photos.map(assetUrl)
              : [],
            priority: typeof (d.latestObservation as { priority?: number }).priority === 'number'
              ? (d.latestObservation as { priority: number }).priority
              : 0,
          }
        : null,
  };
}
