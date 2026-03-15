import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { DashboardGeoPoint } from '@/api/mapApi';

const STATUS_COLORS: Record<string, string> = {
  good: 'hsl(142, 76%, 50%)',
  mixed: 'hsl(38, 92%, 50%)',
  bad: 'hsl(350, 89%, 60%)',
  unverified: 'hsl(0, 0%, 65%)',
};

const TASHKENT_CENTER: [number, number] = [41.2995, 69.2401];
const DEFAULT_ZOOM = 12;

function makeIcon(point: DashboardGeoPoint) {
  const color = STATUS_COLORS[point.status] || STATUS_COLORS.unverified;
  const size = 24;
  return L.divIcon({
    className: 'dashboard-mini-pin',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    " title="${(point.name || '').replace(/"/g, '&quot;')}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface Props {
  points: DashboardGeoPoint[];
  onObjectClick: (objectId: number) => void;
}

export default function DashboardMapPreview({ points, onObjectClick }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: true,
      doubleClickZoom: false,
    }).setView(TASHKENT_CENTER, DEFAULT_ZOOM);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current || !mapRef.current) return;
    layerRef.current.clearLayers();

    if (points.length === 0) {
      mapRef.current.setView(TASHKENT_CENTER, DEFAULT_ZOOM);
      return;
    }

    const bounds = L.latLngBounds(
      points.map((p) => p.coords as L.LatLngTuple)
    );
    points.forEach((point) => {
      const marker = L.marker(point.coords as L.LatLngTuple, {
        icon: makeIcon(point),
      });
      marker.on('click', () => onObjectClick(point.id));
      marker.addTo(layerRef.current!);
    });

    if (points.length === 1) {
      mapRef.current.setView(points[0].coords as L.LatLngTuple, 14);
    } else {
      mapRef.current.fitBounds(bounds.pad(0.15), { maxZoom: 14, animate: false });
    }
  }, [points, onObjectClick]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full min-h-[160px] rounded-b-xl leaflet-dashboard-preview"
      style={{ zIndex: 0 }}
    />
  );
}
