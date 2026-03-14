/**
 * Map/Discovery screen API. Backend must be running (e.g. http://localhost:4000).
 * Set VITE_API_URL in .env for dev if frontend runs on different port.
 */

import type { InfraObject, PromiseStatus } from '@/data/infrastructure';

const BASE = (typeof import.meta !== 'undefined' && (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) || '';

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
    image: m.image || '',
    established: m.established ?? undefined,
    district: m.district ?? undefined,
    capitalRepair: m.capitalRepair ?? undefined,
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
