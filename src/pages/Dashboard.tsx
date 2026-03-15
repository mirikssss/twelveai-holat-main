import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building, AlertTriangle, MessageSquare, RefreshCw,
  School, Heart, GraduationCap, XCircle,
  TrendingUp, Eye, ChevronRight, ShieldAlert, MapPin,
  Clock, Loader2, ArrowLeft, BarChart3, Zap, Construction, Baby, Trophy,
} from 'lucide-react';
import {
  fetchDashboard,
  typeForApi,
  type DashboardResponse,
  type DashboardAttentionObject,
  type DashboardSignal,
} from '@/api/mapApi';
import DashboardMapPreview from '@/components/DashboardMapPreview';

type PeriodFilter = '7d' | '30d' | 'all';
type TypeFilter = 'all' | 'school' | 'hospital' | 'university' | 'road' | 'kindergarten' | 'sport';
type CityFilter = 'all' | 'tashkent';
type DistrictFilter = 'all' | 'Mirzo-Ulugbek' | 'Mirobod' | 'Yashnobod' | 'Shaykhontohur' | 'Chilonzor' | 'Yakkasaroy';

const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: '7d', label: '7 kun' },
  { key: '30d', label: '30 kun' },
  { key: 'all', label: 'Barchasi' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.32 } }),
};

function statusColor(status: string) {
  if (status === 'good') return 'text-success';
  if (status === 'bad') return 'text-destructive';
  if (status === 'mixed') return 'text-warning';
  return 'text-muted-foreground';
}
function statusBg(status: string) {
  if (status === 'good') return 'bg-success';
  if (status === 'bad') return 'bg-destructive';
  if (status === 'mixed') return 'bg-warning';
  return 'bg-muted-foreground';
}
function statusLabel(status: string) {
  if (status === 'good') return 'Tasdiqlangan';
  if (status === 'bad') return 'Muammoli';
  if (status === 'mixed') return 'Tekshiruvda';
  return 'Noma\'lum';
}

function typeLabel(type: string) {
  if (type === 'school') return 'Maktab';
  if (type === 'medical') return 'Shifo';
  if (type === 'university') return 'OTM';
  return type;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [cityFilter, setCityFilter] = useState<CityFilter>('tashkent');
  const [districtFilter, setDistrictFilter] = useState<DistrictFilter>('all');
  const [cityOpen, setCityOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  const apiType = typeFilter === 'hospital' ? 'medical' : typeFilter === 'all' ? 'all' : typeForApi(typeFilter);

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<DashboardResponse>({
    queryKey: ['dashboard', apiType, period],
    queryFn: () => fetchDashboard({ type: apiType, period }),
    staleTime: 30_000,
  });

  const handleRefresh = useCallback(() => { refetch(); }, [refetch]);

  const summary = data?.summary;
  const allTopObjects = data?.topAttentionObjects ?? [];
  const allProblemCats = data?.problemCategories ?? [];
  const allSignals = data?.latestSignals ?? [];
  const allNoVerif = data?.objectsWithoutVerifications ?? [];
  const allGeo = data?.geoSummary ?? [];
  const allDistricts = data?.districtSummary ?? [];

  const activeDistricts = useMemo(() => {
    if (districtFilter === 'all') return allDistricts;
    const namePart =
      districtFilter === 'Mirzo-Ulugbek' ? 'Мирзо-Улугбек' :
      districtFilter === 'Mirobod' ? 'Мирабад' :
      districtFilter === 'Yashnobod' ? 'Яшнобод' :
      districtFilter === 'Shaykhontohur' ? 'Шайхантахур' :
      districtFilter === 'Chilonzor' ? 'Чиланзар' :
      districtFilter === 'Yakkasaroy' ? 'Яккасарой' : '';
    if (!namePart) return allDistricts;
    return allDistricts.filter((d) => d.district.includes(namePart));
  }, [allDistricts, districtFilter]);

  const filteredByDistrict = useMemo(() => {
    if (districtFilter === 'all') {
      return {
        top: allTopObjects,
        cats: allProblemCats,
        sigs: allSignals,
        nov: allNoVerif,
        geo: allGeo,
      };
    }
    const matchDistrict = (d?: string | null) => {
      if (!d) return false;
      const dn = d.toLowerCase();
      if (districtFilter === 'Mirzo-Ulugbek') return dn.includes('мирзо-улугбек');
      if (districtFilter === 'Mirobod') return dn.includes('мираба');
      if (districtFilter === 'Yashnobod') return dn.includes('яшнобод');
      if (districtFilter === 'Shaykhontohur') return dn.includes('шайхантахур');
      if (districtFilter === 'Chilonzor') return dn.includes('чиланза');
      if (districtFilter === 'Yakkasaroy') return dn.includes('яккасарой');
      return true;
    };
    const top = allTopObjects.filter((o) => matchDistrict(o.district));
    const sigs = allSignals.filter((s) => matchDistrict(s.district));
    const nov = allNoVerif.filter((o) => matchDistrict(o.district));
    const visibleIds = new Set([...top.map((o) => o.id), ...nov.map((o) => o.id), ...sigs.map((s) => s.objectId)]);
    return {
      top,
      cats: allProblemCats,
      sigs,
      nov,
      geo: allGeo.filter((o) => visibleIds.has(o.id)),
    };
  }, [allTopObjects, allProblemCats, allSignals, allNoVerif, allGeo, districtFilter]);

  const topObjects = filteredByDistrict.top.slice(0, 5);
  const signals = filteredByDistrict.sigs.slice(0, 5);
  const noVerif = filteredByDistrict.nov;
  const geo = filteredByDistrict.geo;
  const districts = activeDistricts;

  const problemCats = useMemo(() => {
    if (districtFilter === 'all') return filteredByDistrict.cats;
    const sigs = filteredByDistrict.sigs;
    const byCat = sigs.reduce<Map<string, { count: number; objects: Set<number> }>>((acc, s) => {
      const cat = s.category || 'Boshqa';
      const cur = acc.get(cat) || { count: 0, objects: new Set<number>() };
      cur.count += 1;
      cur.objects.add(s.objectId);
      acc.set(cat, cur);
      return acc;
    }, new Map());
    return Array.from(byCat.entries())
      .map(([categoryLabel, data]) => ({
        categoryLabel,
        issueCount: data.count,
        affectedObjectsCount: data.objects.size,
      }))
      .sort((a, b) => b.issueCount - a.issueCount);
  }, [districtFilter, filteredByDistrict.cats, filteredByDistrict.sigs]);

  const summaryFiltered = useMemo(() => {
    if (districtFilter === 'all') {
      return summary
        ? {
            totalObjects: summary.totalObjects,
            attentionObjects: summary.attentionObjects,
            checkingObjects: summary.checkingObjects,
            newObservationsCount: summary.newObservationsCount,
          }
        : { totalObjects: 0, attentionObjects: 0, checkingObjects: 0, newObservationsCount: 0 };
    }
    return {
      totalObjects: geo.length,
      attentionObjects: geo.filter((o) => o.status === 'bad').length,
      checkingObjects: geo.filter((o) => o.status === 'mixed').length,
      newObservationsCount: filteredByDistrict.sigs.length,
    };
  }, [districtFilter, summary, geo, filteredByDistrict.sigs.length]);

  const maxIssue = problemCats[0]?.issueCount || 1;

  return (
    <div className="flex justify-center bg-muted min-h-screen">
      <div className="w-full max-w-[480px] bg-background min-h-screen flex flex-col shadow-2xl">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-foreground">Tahlil</h1>
                <p className="text-[11px] text-muted-foreground">Obyektlar holati va fuqarolar kuzatuvlari</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary active:scale-95 transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-muted-foreground ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filters: city, district, type, period */}
          <div className="flex flex-col gap-2 px-4 pb-3">
            <div className="flex gap-2">
              {/* City */}
              <div className="relative flex-1">
                <button
                  onClick={() => { setCityOpen(!cityOpen); setDistrictOpen(false); setTypeOpen(false); }}
                  className="w-full flex items-center justify-between bg-background px-4 py-2.5 rounded-xl shadow-md border border-border/50 text-xs font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Building className="w-4 h-4 text-muted-foreground" />
                    {cityFilter === 'all' ? 'Barcha shaharlari' : 'Toshkent shahri'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${cityOpen ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {cityOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full mt-1.5 left-0 right-0 bg-background rounded-xl shadow-lg border border-border/50 py-1 z-40 overflow-hidden"
                    >
                      {[
                        { key: 'tashkent' as CityFilter, label: 'Toshkent shahri' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setCityFilter(opt.key); setCityOpen(false); }}
                          className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${
                            cityFilter === opt.key ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-secondary'
                          }`}
                        >
                          <Building className={`w-4 h-4 shrink-0 ${cityFilter === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* District */}
              <div className="relative flex-1">
                <button
                  onClick={() => { setDistrictOpen(!districtOpen); setCityOpen(false); setTypeOpen(false); }}
                  className="w-full flex items-center justify-between bg-background px-4 py-2.5 rounded-xl shadow-md border border-border/50 text-xs font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2 truncate">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    {districtFilter === 'all' ? 'Barcha tumanlar' : 'Tanlangan tuman'}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${districtOpen ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {districtOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full mt-1.5 left-0 right-0 bg-background rounded-xl shadow-lg border border-border/50 py-1 z-40 overflow-hidden max-h-60 overflow-y-auto"
                    >
                      {[
                        { key: 'all' as DistrictFilter, label: 'Barcha tumanlar' },
                        { key: 'Mirzo-Ulugbek' as DistrictFilter, label: "Mirzo Ulug'bek tumani" },
                        { key: 'Mirobod' as DistrictFilter, label: 'Mirobod tumani' },
                        { key: 'Yashnobod' as DistrictFilter, label: 'Yashnobod tumani' },
                        { key: 'Shaykhontohur' as DistrictFilter, label: 'Shayxontohur tumani' },
                        { key: 'Chilonzor' as DistrictFilter, label: 'Chilonzor tumani' },
                        { key: 'Yakkasaroy' as DistrictFilter, label: 'Yakkasaroy tumani' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setDistrictFilter(opt.key); setDistrictOpen(false); }}
                          className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${
                            districtFilter === opt.key ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-secondary'
                          }`}
                        >
                          <MapPin className={`w-4 h-4 shrink-0 ${districtFilter === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex gap-2">
              {/* Type */}
              <div className="relative flex-1">
                <button
                  onClick={() => { setTypeOpen(!typeOpen); setCityOpen(false); setDistrictOpen(false); }}
                  className="w-full flex items-center justify-between bg-background px-4 py-2.5 rounded-xl shadow-md border border-border/50 text-xs font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2 truncate">
                    <School className="w-4 h-4 text-muted-foreground" />
                    {typeFilter === 'all' ? 'Barcha obyekt turlari' : typeLabel(typeFilter)}
                  </span>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${typeOpen ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {typeOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full mt-1.5 left-0 right-0 bg-background rounded-xl shadow-lg border border-border/50 py-1 z-40 overflow-hidden"
                    >
                      {[
                        { key: 'all' as TypeFilter, label: 'Barchasi', icon: Building },
                        { key: 'school' as TypeFilter, label: 'Maktablar', icon: School },
                        { key: 'hospital' as TypeFilter, label: 'Shifo', icon: Heart },
                        { key: 'kindergarten' as TypeFilter, label: "Bog'cha", icon: Baby },
                        { key: 'sport' as TypeFilter, label: 'Sport', icon: Trophy },
                        { key: 'university' as TypeFilter, label: 'OTM', icon: GraduationCap },
                        { key: 'road' as TypeFilter, label: "Yo'l", icon: Construction },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setTypeFilter(opt.key); setTypeOpen(false); }}
                          className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${
                            typeFilter === opt.key ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-secondary'
                          }`}
                        >
                          <opt.icon className={`w-4 h-4 shrink-0 ${typeFilter === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Period */}
              <div className="flex-1 flex gap-1.5">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setPeriod(opt.key)}
                    className={`flex-1 py-2 rounded-xl text-[11px] font-semibold text-center transition-colors ${
                      period === opt.key
                        ? 'bg-foreground text-background'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pb-10">

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground font-medium">Tahlil yuklanmoqda...</p>
              </motion.div>
            ) : error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 gap-4 px-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">Ma'lumot yuklanmadi</p>
                  <p className="text-xs text-muted-foreground">Backend ishlayotganini tekshiring</p>
                </div>
                <button onClick={handleRefresh} className="py-2.5 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform">
                  Qayta urinib ko'rish
                </button>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* ── KPI Cards (filtering applies) ──────────────────────── */}
                <div className="grid grid-cols-2 gap-2.5 p-4">
                  {[
                    { label: 'Jami obyektlar', value: summaryFiltered.totalObjects, icon: Building, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'Muammoli', value: summaryFiltered.attentionObjects, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
                    { label: 'Tekshiruvda', value: summaryFiltered.checkingObjects, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
                    { label: 'Yangi xabarlar', value: summaryFiltered.newObservationsCount, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
                  ].map((kpi, i) => (
                    <motion.div
                      key={kpi.label}
                      custom={i}
                      initial="hidden"
                      animate="visible"
                      variants={fadeUp}
                      className="bg-card rounded-2xl border border-border p-4"
                    >
                      <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2.5`}>
                        <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                      </div>
                      <p className="text-2xl font-black text-foreground">{kpi.value}</p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
                    </motion.div>
                  ))}
                </div>

                {/* ── Mini-map (real Leaflet map with object coordinates) ─── */}
                <div className="px-4 mb-4">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3">
                      <h2 className="text-sm font-bold text-foreground">Xarita ko'rinishi</h2>
                      <button
                        onClick={() => navigate('/')}
                        className="text-[11px] font-semibold text-primary flex items-center gap-0.5 active:opacity-70"
                      >
                        Ochish <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="h-[160px] relative bg-muted">
                      <DashboardMapPreview
                        points={geo}
                        onObjectClick={(id) => navigate('/', { state: { openObject: id } })}
                      />
                      <p className="absolute bottom-2 right-3 text-[10px] text-muted-foreground z-[1] pointer-events-none bg-background/70 px-1.5 py-0.5 rounded">Toshkent shahri</p>
                      <div className="absolute bottom-2 left-3 flex gap-2.5 z-[1] pointer-events-none bg-background/70 px-2 py-1 rounded">
                        {[['bg-success', 'Yaxshi'], ['bg-warning', 'Tekshiruvda'], ['bg-destructive', 'Muammo']].map(([bg, lbl]) => (
                          <span key={lbl} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <span className={`w-2 h-2 rounded-full ${bg}`} />{lbl}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── District summary ──────────────────────────────────── */}
                {districts.length > 0 && (
                  <Section title="Tumanlar bo'yicha" icon={MapPin}>
                    <div className="space-y-2">
                      {districts.slice(0, 4).map((d, i) => (
                        <motion.div key={d.district} custom={i} initial="hidden" animate="visible" variants={fadeUp}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{d.district}</p>
                            <p className="text-[10px] text-muted-foreground">{d.total} ta obyekt</p>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            {d.attention > 0 && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">{d.attention}</span>}
                            {d.checking > 0 && <span className="text-[10px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded-full">{d.checking}</span>}
                            {d.confirmed > 0 && <span className="text-[10px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded-full">{d.confirmed}</span>}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Section>
                )}

                {/* ── Top problematic objects ───────────────────────────── */}
                <Section title="Muammoli obyektlar" icon={ShieldAlert}>
                  {topObjects.length === 0 ? (
                    <EmptyState text="Muammoli obyektlar hozircha yo'q" />
                  ) : (
                    <div className="space-y-2">
                      {topObjects.map((obj: DashboardAttentionObject, i: number) => (
                        <motion.div
                          key={obj.id}
                          custom={i}
                          initial="hidden"
                          animate="visible"
                          variants={fadeUp}
                          onClick={() => navigate('/', { state: { openObject: obj.id } })}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform"
                        >
                          <div className="relative shrink-0">
                            <img src={obj.image} alt={obj.name} className="w-12 h-12 rounded-xl object-cover" />
                            <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${statusBg(obj.status)}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{obj.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{typeLabel(obj.type)}</span>
                              {obj.district && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />{obj.district}
                                </span>
                              )}
                            </div>
                            <span className={`text-[10px] font-semibold ${statusColor(obj.status)}`}>{statusLabel(obj.status)}</span>
                          </div>
                          <div className="text-right shrink-0 space-y-0.5">
                            <div>
                              <p className="text-sm font-black text-destructive leading-none">{obj.observationCount}</p>
                              <p className="text-[9px] text-muted-foreground">xabar</p>
                            </div>
                            {obj.problematicPromises > 0 && (
                              <div>
                                <p className="text-xs font-bold text-warning leading-none">{obj.problematicPromises}</p>
                                <p className="text-[9px] text-muted-foreground">muammo</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* ── Problem categories with progress bars ─────────────── */}
                <Section title="Ko'p muammoli kategoriyalar" icon={TrendingUp}>
                  {problemCats.length === 0 ? (
                    <EmptyState text="Bu davr uchun ma'lumot topilmadi" />
                  ) : (
                    <div className="space-y-3">
                      {problemCats.map((cat, i) => (
                        <motion.div key={cat.categoryLabel} custom={i} initial="hidden" animate="visible" variants={fadeUp}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-bold text-foreground">{cat.categoryLabel}</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-destructive">{cat.issueCount}</span>
                              <span className="text-[10px] text-muted-foreground">ta muammo · {cat.affectedObjectsCount} obyekt</span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (cat.issueCount / maxIssue) * 100)}%` }}
                              transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                              className="h-full bg-destructive rounded-full"
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* ── Latest signals ─────────────────────────────────────── */}
                <Section title="So'nggi signallar" icon={MessageSquare}>
                  {signals.length === 0 ? (
                    <EmptyState text="Yangi signallar yo'q" />
                  ) : (
                    <div className="space-y-2">
                      {signals.map((sig: DashboardSignal, i: number) => (
                        <motion.div
                          key={sig.id}
                          custom={i}
                          initial="hidden"
                          animate="visible"
                          variants={fadeUp}
                          onClick={() => navigate('/', { state: { openObject: sig.objectId } })}
                          className="p-3 rounded-xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {sig.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />{sig.timeLabel}
                            </span>
                          </div>
                          <p className="text-xs text-foreground font-medium leading-relaxed line-clamp-2">{sig.text}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />{sig.objectName}
                            {sig.district && <span>· {sig.district}</span>}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* ── Objects without verifications ─────────────────────── */}
                <Section title="Tekshirilmagan obyektlar" icon={Eye}>
                  {noVerif.length === 0 ? (
                    <EmptyState text="Barcha obyektlar tekshirilgan" />
                  ) : (
                    <div className="space-y-2">
                      {noVerif.map((obj: DashboardAttentionObject, i: number) => (
                        <motion.div
                          key={obj.id}
                          custom={i}
                          initial="hidden"
                          animate="visible"
                          variants={fadeUp}
                          onClick={() => navigate('/', { state: { openObject: obj.id } })}
                          className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform"
                        >
                          <img src={obj.image} alt={obj.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{obj.name}</p>
                            <p className="text-[10px] text-muted-foreground">{obj.district || obj.address}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-black text-warning">{obj.totalInspections}</p>
                            <p className="text-[9px] text-muted-foreground">tekshiruv</p>
                          </div>
                        </motion.div>
                      ))}
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15">
                        <Zap className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-xs text-primary font-semibold">Bu obyektlarga birinchi bo'lib kiring va tekshiring!</p>
                      </div>
                    </div>
                  )}
                </Section>

                {/* ── Object type breakdown ─────────────────────────────── */}
                {geo.length > 0 && (
                  <div className="px-4 mb-4">
                    <div className="flex items-center gap-2 mb-2.5">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <h2 className="text-sm font-bold text-foreground">Turlar bo'yicha</h2>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        Object.entries(
                          geo.reduce<Record<string, number>>((acc, o) => { acc[o.type] = (acc[o.type] || 0) + 1; return acc; }, {})
                        ) as [string, number][]
                      ).map(([t, count]) => {
                        const TypeIcon = t === 'school' ? School : t === 'medical' ? Heart : GraduationCap;
                        return (
                          <div key={t} className="bg-card border border-border rounded-xl p-3 text-center">
                            <TypeIcon className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                            <p className="text-lg font-black text-foreground">{count}</p>
                            <p className="text-[10px] text-muted-foreground">{typeLabel(t)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Building; children: React.ReactNode }) {
  return (
    <div className="px-4 mb-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-8 text-center rounded-xl bg-secondary/50 border border-border">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
