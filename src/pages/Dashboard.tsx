import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building, AlertTriangle, Clock, MessageSquare, RefreshCw,
  ChevronDown, MapPin, School, Heart, Baby, Trophy, GraduationCap, Construction,
  CheckCircle2, XCircle, TrendingUp, Eye, ChevronRight, ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { INFRASTRUCTURE_OBJECTS, type InfraObject, type ObjectType } from '@/data/infrastructure';

type PeriodFilter = '7d' | '30d' | 'all';
type TypeFilter = 'all' | ObjectType;
type StatusFilter = 'all' | 'good' | 'mixed' | 'bad';

const TYPE_OPTIONS: { key: TypeFilter; label: string; icon: typeof School }[] = [
  { key: 'all', label: 'Barchasi', icon: Building },
  { key: 'school', label: 'Maktablar', icon: School },
  { key: 'hospital', label: 'Shifoxonalar', icon: Heart },
  { key: 'kindergarten', label: "Bog'chalar", icon: Baby },
  { key: 'sport', label: 'Sport', icon: Trophy },
  { key: 'university', label: 'Universitetlar', icon: GraduationCap },
  { key: 'road', label: "Yo'llar", icon: Construction },
];

const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: '7d', label: '7 kun' },
  { key: '30d', label: '30 kun' },
  { key: 'all', label: 'Barchasi' },
];

const cardVariant = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3 } }),
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [period, setPeriod] = useState<PeriodFilter>('7d');
  const [statusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    return INFRASTRUCTURE_OBJECTS.filter((o) => {
      const matchType = typeFilter === 'all' || o.type === typeFilter;
      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [typeFilter, statusFilter]);

  // KPI calculations
  const totalObjects = filtered.length;
  const attentionObjects = filtered.filter(o => o.status === 'bad').length;
  const checkingObjects = filtered.filter(o => o.status === 'mixed').length;
  const totalObservations = filtered.reduce((sum, o) => sum + o.observations.length, 0);
  const totalVerifications = filtered.reduce((sum, o) => sum + o.totalInspections, 0);

  // Top problematic objects (sorted by observations + bad status)
  const topProblematic = useMemo(() => {
    return [...filtered]
      .filter(o => o.status === 'bad' || o.status === 'mixed')
      .sort((a, b) => {
        const scoreA = a.observations.length * 2 + (a.status === 'bad' ? 10 : 0);
        const scoreB = b.observations.length * 2 + (b.status === 'bad' ? 10 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [filtered]);

  // Problem categories
  const problemCategories = useMemo(() => {
    const catMap = new Map<string, { issues: number; objects: Set<number> }>();
    filtered.forEach(obj => {
      obj.categories.forEach(cat => {
        const issues = cat.promises.filter(p => p.reported > p.confirmed * 0.3).length;
        if (issues > 0) {
          const existing = catMap.get(cat.title) || { issues: 0, objects: new Set<number>() };
          existing.issues += issues;
          existing.objects.add(obj.id);
          catMap.set(cat.title, existing);
        }
      });
    });
    return Array.from(catMap.entries())
      .map(([name, data]) => ({ name, issues: data.issues, objectCount: data.objects.size }))
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 5);
  }, [filtered]);

  // Latest signals
  const latestSignals = useMemo(() => {
    const all: { obs: typeof INFRASTRUCTURE_OBJECTS[0]['observations'][0]; obj: InfraObject }[] = [];
    filtered.forEach(obj => {
      obj.observations.forEach(obs => all.push({ obs, obj }));
    });
    return all.slice(0, 5);
  }, [filtered]);

  // Objects without verifications
  const noVerifications = useMemo(() => {
    return filtered.filter(o => o.totalInspections < 5).slice(0, 5);
  }, [filtered]);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const statusColor = (status: string) => {
    if (status === 'good') return 'text-success';
    if (status === 'bad') return 'text-destructive';
    return 'text-warning';
  };

  const statusLabel = (status: string) => {
    if (status === 'good') return 'Tasdiqlangan';
    if (status === 'bad') return 'Muammoli';
    return 'Tekshiruvda';
  };

  return (
    <div className="flex justify-center bg-muted min-h-screen">
      <div className="w-full max-w-[480px] bg-background min-h-screen flex flex-col shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-30 bg-background border-b border-border">
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
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary active:scale-95 transition-all"
            >
              <RefreshCw className={`w-4.5 h-4.5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
            {/* Type chips */}
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setTypeFilter(opt.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                  typeFilter === opt.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Period selector */}
          <div className="flex gap-1.5 px-4 pb-3">
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setPeriod(opt.key)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold text-center transition-colors ${
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-8">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-2.5 p-4">
            {[
              { label: 'Jami obyektlar', value: totalObjects, icon: Building, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'Muammoli', value: attentionObjects, icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
              { label: 'Tekshiruvda', value: checkingObjects, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
              { label: 'Yangi xabarlar', value: totalObservations, icon: MessageSquare, color: 'text-primary', bg: 'bg-primary/10' },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={cardVariant}
                className="bg-card rounded-2xl border border-border p-4 active:scale-[0.97] transition-transform cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center mb-2.5`}>
                  <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{kpi.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Mini map placeholder */}
          <div className="px-4 mb-4">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <h2 className="text-sm font-bold text-foreground">Xarita ko'rinishi</h2>
                <button
                  onClick={() => navigate('/')}
                  className="text-[11px] font-semibold text-primary flex items-center gap-0.5"
                >
                  Ochish <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="h-[140px] bg-secondary/50 flex items-center justify-center relative">
                {/* Mini map dots */}
                {filtered.map(obj => {
                  const x = ((obj.coords[1] - 69.15) / 0.25) * 100;
                  const y = ((41.35 - obj.coords[0]) / 0.12) * 100;
                  return (
                    <div
                      key={obj.id}
                      className={`absolute w-2.5 h-2.5 rounded-full border-2 border-background ${
                        obj.status === 'good' ? 'bg-success' : obj.status === 'bad' ? 'bg-destructive' : 'bg-warning'
                      }`}
                      style={{
                        left: `${Math.max(5, Math.min(95, x))}%`,
                        top: `${Math.max(10, Math.min(90, y))}%`
                      }}
                    />
                  );
                })}
                <p className="text-[10px] text-muted-foreground absolute bottom-2 right-3">Toshkent shahri</p>
              </div>
            </div>
          </div>

          {/* Top problematic objects */}
          <Section title="Muammoli obyektlar" icon={ShieldAlert}>
            {topProblematic.length === 0 ? (
              <EmptyState text="Muammoli obyektlar hozircha yo'q" />
            ) : (
              <div className="space-y-2">
                {topProblematic.map((obj, i) => (
                  <motion.div
                    key={obj.id}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariant}
                    onClick={() => navigate('/', { state: { openObject: obj.id } })}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <img src={obj.image} alt={obj.name} className="w-11 h-11 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{obj.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {obj.district || obj.address}
                        </span>
                        <span className={`text-[10px] font-semibold ${statusColor(obj.status)}`}>
                          {statusLabel(obj.status)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-destructive">{obj.observations.length}</p>
                      <p className="text-[9px] text-muted-foreground">xabar</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Section>

          {/* Problem categories */}
          <Section title="Ko'p muammoli kategoriyalar" icon={TrendingUp}>
            {problemCategories.length === 0 ? (
              <EmptyState text="Bu davr uchun ma'lumot topilmadi" />
            ) : (
              <div className="space-y-2">
                {problemCategories.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{cat.objectCount} obyektda</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-destructive">{cat.issues}</span>
                      <span className="text-[10px] text-muted-foreground">muammo</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Latest signals */}
          <Section title="So'nggi signallar" icon={MessageSquare}>
            {latestSignals.length === 0 ? (
              <EmptyState text="Yangi signallar yo'q" />
            ) : (
              <div className="space-y-2">
                {latestSignals.map(({ obs, obj }, i) => (
                  <div key={obs.id} className="p-3 rounded-xl bg-card border border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{obs.category}</span>
                      <span className="text-[10px] text-muted-foreground">{obs.time}</span>
                    </div>
                    <p className="text-xs text-foreground font-medium leading-relaxed">{obs.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {obj.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Objects without verifications */}
          <Section title="Tekshirilmagan obyektlar" icon={Eye}>
            {noVerifications.length === 0 ? (
              <EmptyState text="Barcha obyektlar tekshirilgan" />
            ) : (
              <div className="space-y-2">
                {noVerifications.map((obj, i) => (
                  <div
                    key={obj.id}
                    onClick={() => navigate('/', { state: { openObject: obj.id } })}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <img src={obj.image} alt={obj.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{obj.name}</p>
                      <p className="text-[10px] text-muted-foreground">{obj.district || obj.address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold text-warning">{obj.totalInspections}</p>
                      <p className="text-[9px] text-muted-foreground">tekshiruv</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Activity summary */}
          <div className="px-4 mb-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-card rounded-2xl border border-border p-4 text-center">
                <p className="text-xl font-bold text-foreground">{totalVerifications}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">Jami tekshiruvlar</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 text-center">
                <p className="text-xl font-bold text-foreground">{totalObservations}</p>
                <p className="text-[10px] text-muted-foreground font-medium mt-1">Jami xabarlar</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

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
