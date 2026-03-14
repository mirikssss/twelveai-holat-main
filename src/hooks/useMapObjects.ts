import { useQuery } from '@tanstack/react-query';
import { fetchMapObjects, toInfraObject, type MapObject } from '@/api/mapApi';
import type { InfraObject } from '@/data/infrastructure';
import { typeForApi } from '@/api/mapApi';

export interface UseMapObjectsParams {
  search: string;
  typeFilter: string;
  statusFilter: string;
  userLocation: [number, number] | null;
}

export function useMapObjects({
  search,
  typeFilter,
  statusFilter,
  userLocation,
}: UseMapObjectsParams): {
  objects: InfraObject[];
  isLoading: boolean;
  error: Error | null;
} {
  const [lat, lng] = userLocation ?? [null, null];

  const { data = [], isLoading, error } = useQuery({
    queryKey: ['mapObjects', search, typeFilter, statusFilter, lat, lng],
    queryFn: () =>
      fetchMapObjects({
        q: search || undefined,
        type: typeFilter === 'all' ? undefined : typeForApi(typeFilter),
        status: statusFilter === 'all' ? undefined : statusFilter,
        lat: lat ?? undefined,
        lng: lng ?? undefined,
        radius: 2000,
      }),
    staleTime: 60 * 1000,
  });

  const objects: InfraObject[] = (data as MapObject[]).map(toInfraObject);

  return { objects, isLoading, error: error as Error | null };
}
