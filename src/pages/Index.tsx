import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ChevronDown, MapPin, School, Heart, Baby, Trophy, GraduationCap, Construction, CheckCircle2, AlertTriangle, XCircle, Clock, Building } from 'lucide-react';
import MapView from '@/components/MapView';
import StatusBadge from '@/components/StatusBadge';
import ObjectSheet from '@/components/ObjectSheet';
import CameraInspection from '@/components/CameraInspection';
import HamburgerMenu from '@/components/HamburgerMenu';
import { useMapObjects } from '@/hooks/useMapObjects';
import { fetchObjectDetail, detailResponseToInfraObject } from '@/api/mapApi';
import { type InfraObject, type InfraPromise, type Observation, type ObjectType } from '@/data/infrastructure';

type StatusFilter = 'all' | 'good' | 'mixed' | 'bad';
type TypeFilter = 'all' | ObjectType;

const TYPE_FILTER_DEFAULT_LABEL = "Tur";
const STATUS_FILTER_DEFAULT_LABEL = "Holat";

const TYPE_OPTIONS: { key: TypeFilter; label: string; icon: typeof School }[] = [
  { key: 'all', label: 'Barchasi', icon: Building },
  { key: 'school', label: 'Maktablar', icon: School },
  { key: 'hospital', label: 'Shifoxonalar', icon: Heart },
  { key: 'kindergarten', label: "Bog'chalar", icon: Baby },
  { key: 'sport', label: 'Sport', icon: Trophy },
  { key: 'university', label: 'Universitetlar', icon: GraduationCap },
  { key: 'road', label: "Yo'llar", icon: Construction },
];

const STATUS_OPTIONS: { key: StatusFilter; label: string; icon: typeof CheckCircle2 }[] = [
  { key: 'all', label: 'Barchasi', icon: Clock },
  { key: 'good', label: 'Tasdiqlangan', icon: CheckCircle2 },
  { key: 'mixed', label: 'Tekshirish kerak', icon: AlertTriangle },
  { key: 'bad', label: 'Muammolar', icon: XCircle },
];

const GEO_CACHE_KEY = 'holat_map_geo';
const GEO_CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 min

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function Index() {
  const [selectedObject, setSelectedObject] = useState<InfraObject | null>(null);
  const [inspectingPromise, setInspectingPromise] = useState<InfraPromise | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(() => {
    try {
      const raw = sessionStorage.getItem(GEO_CACHE_KEY);
      if (!raw) return null;
      const { lat, lng, ts } = JSON.parse(raw);
      if (typeof lat !== 'number' || typeof lng !== 'number' || !ts) return null;
      if (Date.now() - ts > GEO_CACHE_MAX_AGE_MS) return null;
      return [lat, lng];
    } catch {
      return null;
    }
  });
  const [detailRefreshKey, setDetailRefreshKey] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation((prev) => prev ?? [41.2995, 69.2401]);
      return;
    }
    const saveCache = (lat: number, lng: number) => {
      try {
        sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify({ lat, lng, ts: Date.now() }));
      } catch {}
    };
    let settled = false;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        saveCache(next[0], next[1]);
        if (!settled) {
          settled = true;
          setUserLocation(next);
          return;
        }
        setUserLocation((prev) => {
          if (!prev) return next;
          const d = Math.abs(prev[0] - next[0]) + Math.abs(prev[1] - next[1]);
          return d > 0.0005 ? next : prev;
        });
      },
      () => {
        setUserLocation((prev) => {
          const fallback = prev ?? [41.2995, 69.2401];
          saveCache(fallback[0], fallback[1]);
          return fallback;
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Load full object detail (categories, observations) when sheet opens.
  // Only apply response if still viewing the same object (avoid stale data when switching quickly).
  useEffect(() => {
    if (!selectedObject?.id) return;
    const id = selectedObject.id;
    fetchObjectDetail(id)
      .then((d) => {
        setSelectedObject((prev) =>
          prev?.id === id ? detailResponseToInfraObject(d) : prev
        );
      })
      .catch((err) => console.error('[ObjectDetail] Failed to load detail for id', id, err));
  }, [selectedObject?.id, detailRefreshKey]);

  const { objects: filtered, isLoading, error } = useMapObjects({
    search,
    typeFilter,
    statusFilter,
    userLocation,
  });

  const handlePinClick = useCallback((obj: InfraObject) => {
    setActiveId(obj.id);
    setFlyTo(obj.coords);
    const card = cardRefs.current.get(obj.id);
    card?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, []);

  const handleCardClick = (obj: InfraObject) => {
    setFlyTo(obj.coords);
    setActiveId(obj.id);
    setSelectedObject(obj);
  };

  const currentType = TYPE_OPTIONS.find(o => o.key === typeFilter)!;
  const currentStatus = STATUS_OPTIONS.find(o => o.key === statusFilter)!;
  const typeButtonLabel = typeFilter === 'all' ? TYPE_FILTER_DEFAULT_LABEL : currentType.label;
  const statusButtonLabel = statusFilter === 'all' ? STATUS_FILTER_DEFAULT_LABEL : currentStatus.label;

  return (
    <div className="flex justify-center bg-muted min-h-screen">
      <main className="w-full max-w-[480px] bg-background relative overflow-hidden shadow-2xl" style={{ height: '100dvh' }}>

        {/* Map layer */}
        <div className="absolute inset-0 z-0">
          {error && (
            <div className="absolute top-14 left-2 right-2 z-30 bg-destructive/90 text-destructive-foreground text-xs px-3 py-2 rounded-lg">
              Xarita ma'lumotlari yuklanmadi. Backend ishlatilayotganini tekshiring.
            </div>
          )}
          <MapView objects={filtered} activeId={activeId} flyTo={flyTo} onPinClick={handlePinClick} userLocation={userLocation} />
        </div>

        {/* Top controls */}
        <div className="absolute top-2 left-2 right-2 z-20 flex flex-col gap-3">
          {/* Search + Hamburger row */}
          <div className="flex gap-3">
            {/* Hamburger 20% */}
            <div className="w-[20%] h-[48px]">
              <HamburgerMenu />
            </div>
            {/* Search 80% */}
            <div className="flex-1 flex items-center bg-background/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-md border border-border/50">
              <Search className="w-4.5 h-4.5 text-muted-foreground mr-2.5 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Maktab, shifoxona qidirish..."
                className="bg-transparent border-none outline-none text-sm w-full font-medium text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex gap-3">
            {/* Type filter */}
            <div className="relative flex-1">
              <button
                onClick={() => { setTypeOpen(!typeOpen); setStatusOpen(false); }}
                className="w-full flex items-center justify-between bg-background/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-md border border-border/50 text-xs font-semibold text-foreground"
              >
                <span className="flex items-center gap-2 truncate">
                  <currentType.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                  {typeButtonLabel}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${typeOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {typeOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-1.5 left-0 right-0 bg-background rounded-xl shadow-lg border border-border/50 py-1 z-50 overflow-hidden"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setTypeFilter(opt.key); setTypeOpen(false); }}
                        className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${typeFilter === opt.key ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-secondary'}`}
                      >
                        <opt.icon className={`w-4 h-4 ${typeFilter === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Status filter */}
            <div className="relative flex-1">
              <button
                onClick={() => { setStatusOpen(!statusOpen); setTypeOpen(false); }}
                className="w-full flex items-center justify-between bg-background/95 backdrop-blur-md px-4 py-3 rounded-xl shadow-md border border-border/50 text-xs font-semibold text-foreground"
              >
                <span className="flex items-center gap-2 truncate">
                  <currentStatus.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                  {statusButtonLabel}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${statusOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {statusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-1.5 left-0 right-0 bg-background rounded-xl shadow-lg border border-border/50 py-1 z-50 overflow-hidden"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => { setStatusFilter(opt.key); setStatusOpen(false); }}
                        className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${statusFilter === opt.key ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-secondary'}`}
                      >
                        <opt.icon className={`w-4 h-4 ${statusFilter === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Bottom carousel — only after geolocation known, hide when object sheet is open */}
        <AnimatePresence>
          {userLocation && !selectedObject && (
            <motion.div
              ref={carouselRef}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              className="absolute bottom-6 left-0 right-0 z-20 flex gap-3 px-3 overflow-x-auto snap-x snap-mandatory no-scrollbar"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              {(isLoading ? [] : filtered).map((obj) => {
            const dist = obj.distanceMeters ?? (userLocation ? getDistance(userLocation[0], userLocation[1], obj.coords[0], obj.coords[1]) : null);
            return (
              <div
                key={obj.id}
                ref={(el) => { if (el) cardRefs.current.set(obj.id, el); }}
                onClick={() => handleCardClick(obj)}
                className={`min-w-[260px] bg-background/95 backdrop-blur-sm p-3 rounded-2xl shadow-lg flex gap-3 snap-center cursor-pointer active:scale-[0.97] transition-all duration-200 border ${
                  activeId === obj.id ? 'border-primary shadow-primary/15' : 'border-border/40'
                }`}
              >
                <img src={obj.image} className="w-14 h-14 rounded-xl object-cover shrink-0" alt={obj.name} />
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <h3 className="font-bold text-foreground text-sm truncate">{obj.name}</h3>
                  <div className="flex items-center gap-2 mb-1">
                    {dist !== null && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground font-medium">
                        <MapPin className="w-3 h-3" />
                        {formatDistance(dist)}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {obj.promiseCount} va'da
                    </span>
                  </div>
                  <StatusBadge status={obj.status} />
                </div>
              </div>
            );
          })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Close dropdowns on map tap */}
        {(typeOpen || statusOpen) && (
          <div className="absolute inset-0 z-10" onClick={() => { setTypeOpen(false); setStatusOpen(false); }} />
        )}

        {/* Object detail sheet */}
        <AnimatePresence>
          {selectedObject && !inspectingPromise && (
            <ObjectSheet
              object={selectedObject}
              onClose={() => setSelectedObject(null)}
              onInspect={setInspectingPromise}
              onObjectUpdated={(updated) => setSelectedObject(updated)}
            />
          )}
        </AnimatePresence>

        {/* Camera inspection */}
        <AnimatePresence>
          {inspectingPromise && selectedObject && (
            <CameraInspection
              promise={inspectingPromise}
              objectId={selectedObject.id}
              onClose={() => setInspectingPromise(null)}
              onVerified={(data) => {
                setSelectedObject((prev) => {
                  if (!prev) return prev;
                  const newCategories = prev.categories.map((cat) => ({
                    ...cat,
                    promises: cat.promises.map((p) =>
                      p.id === data.id
                        ? { ...p, confirmed: data.confirmedCount, reported: data.reportedCount, status: data.statusLabel }
                        : p
                    ),
                  }));
                  return { ...prev, categories: newCategories };
                });
                setDetailRefreshKey((k) => k + 1);
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
