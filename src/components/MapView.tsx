import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { InfraObject } from '@/data/infrastructure';

const STATUS_COLORS: Record<InfraObject['status'], string> = {
  good: 'hsl(142, 76%, 50%)',
  mixed: 'hsl(38, 92%, 50%)',
  bad: 'hsl(350, 89%, 60%)',
};

const TYPE_SVG: Record<string, string> = {
  school: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  hospital: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"/></svg>`,
  kindergarten: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`,
  sport: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
  university: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  road: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19L20 5"/><path d="M4 5l16 14"/><path d="M12 3v18"/></svg>`,
};

function makeIcon(obj: InfraObject, active: boolean) {
  const color = STATUS_COLORS[obj.status];
  const size = active ? 40 : 32;
  const svg = TYPE_SVG[obj.type] || TYPE_SVG.school;
  const shadow = active ? '0 0 0 4px rgba(0,136,255,0.25), 0 2px 8px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.2)';
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};
      display:flex;align-items:center;justify-content:center;
      border:3px solid white;
      box-shadow:${shadow};
      transition:all 0.2s ease;
    ">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface Props {
  objects: InfraObject[];
  activeId: number | null;
  flyTo: [number, number] | null;
  onPinClick: (obj: InfraObject) => void;
  userLocation: [number, number] | null;
}

export default function MapView({ objects, activeId, flyTo, onPinClick, userLocation }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userLayerRef = useRef<L.LayerGroup | null>(null);
  const initialFlyDone = useRef(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center: [number, number] = [41.2995, 69.2401];
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    userLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersLayerRef.current = null;
      userLayerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!userLayerRef.current || !mapRef.current || !userLocation) return;
    userLayerRef.current.clearLayers();

    L.circle(userLocation, {
      radius: 1000,
      color: 'hsl(211, 100%, 50%)',
      fillColor: 'hsl(211, 100%, 50%)',
      fillOpacity: 0.06,
      weight: 1.5,
      opacity: 0.3,
    }).addTo(userLayerRef.current);

    const userIcon = L.divIcon({
      className: 'custom-pin',
      html: `<div style="position:relative;width:16px;height:16px;">
        <div style="position:absolute;inset:-6px;border-radius:50%;background:hsl(211,100%,50%);opacity:0.2;animation:pulse-ring 2s ease-out infinite;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:hsl(211,100%,50%);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
      </div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    L.marker(userLocation, { icon: userIcon, interactive: false }).addTo(userLayerRef.current);

    // Fly to user location immediately on first load
    if (!initialFlyDone.current) {
      mapRef.current.flyTo(userLocation, 14, { duration: 1.2 });
      initialFlyDone.current = true;
    }
  }, [userLocation]);

  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();
    markersRef.current.clear();

    objects.forEach((obj) => {
      const marker = L.marker(obj.coords, { icon: makeIcon(obj, obj.id === activeId) });
      marker.on('click', () => onPinClick(obj));
      marker.addTo(markersLayerRef.current!);
      markersRef.current.set(obj.id, marker);
    });
  }, [objects, onPinClick, activeId]);

  useEffect(() => {
    if (!mapRef.current || !flyTo) return;
    mapRef.current.flyTo(flyTo, 15, { duration: 0.8 });
  }, [flyTo]);

  return <div ref={mapContainerRef} className="h-full w-full" />;
}
