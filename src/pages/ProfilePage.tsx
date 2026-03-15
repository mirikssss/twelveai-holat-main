import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, FileText, Loader2, ShoppingCart, CheckCircle2, Clock, Wrench, XCircle, ChevronDown, Tag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserObservations, type UserObservation } from '@/api/mapApi';
import ObservationStatusBadge from '@/components/ObservationStatusBadge';
import ReportDetailSheet from '@/components/ReportDetailSheet';

const TIMELINE_KEYS = ['created', 'confirmed', 'in_resolution', 'resolved'] as const;
const TIMELINE_ICONS = { created: Clock, confirmed: CheckCircle2, in_resolution: Wrench, resolved: CheckCircle2 };

const CATEGORY_FILTER_DEFAULT = 'Kategoriya';
const STATUS_FILTER_DEFAULT = 'Holat';

const REPORT_STATUS_OPTIONS: { key: string; label: string; icon: typeof Clock }[] = [
  { key: 'all', label: 'Barchasi', icon: FileText },
  { key: 'pending', label: "Ko'rib chiqilmoqda", icon: Clock },
  { key: 'confirmed', label: 'Tasdiqlandi', icon: CheckCircle2 },
  { key: 'in_resolution', label: 'Hal qilinmoqda', icon: Wrench },
  { key: 'resolved', label: 'Hal qilindi', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rad etildi', icon: XCircle },
];

function getActiveIdx(status: string): number {
  if (status === 'rejected') return 1;
  if (status === 'pending') return 0;
  if (status === 'confirmed') return 1;
  if (status === 'in_resolution') return 2;
  if (status === 'resolved') return 3;
  return 0;
}

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuth();
  const [observations, setObservations] = useState<UserObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedObs, setSelectedObs] = useState<UserObservation | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) { navigate('/auth', { replace: true }); return; }
    fetchUserObservations(user!.phone)
      .then(setObservations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, user, navigate]);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const initials = user?.name ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  const categoryOptions = useMemo(() => {
    const cats = Array.from(new Set(observations.map((o) => o.category))).sort();
    return [{ key: 'all', label: 'Barchasi' }, ...cats.map((c) => ({ key: c, label: c }))];
  }, [observations]);

  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      if (categoryFilter !== 'all' && obs.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && obs.status !== statusFilter) return false;
      return true;
    });
  }, [observations, categoryFilter, statusFilter]);

  const currentCategoryLabel = categoryFilter === 'all' ? CATEGORY_FILTER_DEFAULT : (categoryOptions.find((o) => o.key === categoryFilter)?.label ?? categoryFilter);
  const currentStatusOption = REPORT_STATUS_OPTIONS.find((o) => o.key === statusFilter) ?? REPORT_STATUS_OPTIONS[0];
  const statusButtonLabel = statusFilter === 'all' ? STATUS_FILTER_DEFAULT : currentStatusOption.label;

  // Gamification: уровень и баллы на основе подтверждённых заявок пользователя
  const confirmedReports = useMemo(
    () => observations.filter((o) => ['confirmed', 'in_resolution', 'resolved'].includes(o.status)).length,
    [observations],
  );

  const level = useMemo(() => {
    if (confirmedReports >= 80) return 5;
    if (confirmedReports >= 40) return 4;
    if (confirmedReports >= 15) return 3;
    if (confirmedReports >= 5) return 2;
    return 1;
  }, [confirmedReports]);

  const levelBonus = useMemo(() => {
    if (level === 5) return 20;
    if (level === 4) return 15;
    if (level === 3) return 10;
    if (level === 2) return 5;
    return 0;
  }, [level]);

  const pointsPerReport = 20 + levelBonus;
  const points = confirmedReports * pointsPerReport;
  const maxPoints = 50000;
  const progressPct = Math.min((points / maxPoints) * 100, 100);

  if (!isLoggedIn) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center bg-muted min-h-screen">
      <main className="w-full max-w-[480px] bg-background relative flex flex-col" style={{ minHeight: '100dvh' }}>
        {/* Header */}
        <div className="bg-primary px-5 pt-12 pb-6 rounded-b-[28px]">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full bg-white/15 active:scale-90 transition-transform">
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">Profilim</h1>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white truncate">{user?.name}</p>
              <p className="text-sm text-white/70">+{user?.phone}</p>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 px-4 pt-4 pb-6 overflow-y-auto">
          {/* Gamification block */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-secondary rounded-2xl p-5 mb-5">
            <div className="flex flex-col items-center mb-3">
              <div className="w-14 h-14 rounded-full bg-[#2DD4BF] flex items-center justify-center mb-2">
                <span className="text-xl font-bold text-white">{level}</span>
              </div>
              <p className="text-sm font-bold text-foreground">Sizning darajangiz: <span className="text-[#2DD4BF]">Aktivist</span></p>
            </div>

            <div className="relative w-full h-7 bg-border rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-[#2DD4BF] rounded-full"
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                {points.toLocaleString('ru-RU')}/{maxPoints.toLocaleString('ru-RU')}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mb-4">Har 100 so'm to'lov va o'tkazma uchun 1 ball oling</p>

            <button className="w-full py-3 rounded-2xl bg-[#2DD4BF] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform">
              <ShoppingCart className="w-4 h-4" />
              Payme orqali ballarni almashtirish
            </button>
          </motion.div>

          {/* My reports */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Mening arizalarim ({filteredObservations.length})
              </h2>
            </div>

            {/* Filters — same design as map page */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <button
                  onClick={() => { setCategoryOpen(!categoryOpen); setStatusOpen(false); }}
                  className="w-full flex items-center justify-between bg-background px-4 py-3 rounded-xl shadow-md border border-border/50 text-xs font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Tag className="w-4 h-4 shrink-0 text-muted-foreground" />
                    {currentCategoryLabel}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${categoryOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {categoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full mt-1.5 left-0 right-0 bg-background rounded-xl shadow-lg border border-border/50 py-1 z-50 overflow-hidden max-h-56 overflow-y-auto"
                    >
                      {categoryOptions.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setCategoryFilter(opt.key); setCategoryOpen(false); }}
                          className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${categoryFilter === opt.key ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-secondary'}`}
                        >
                          <Tag className={`w-4 h-4 shrink-0 ${categoryFilter === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative flex-1">
                <button
                  onClick={() => { setStatusOpen(!statusOpen); setCategoryOpen(false); }}
                  className="w-full flex items-center justify-between bg-background px-4 py-3 rounded-xl shadow-md border border-border/50 text-xs font-semibold text-foreground"
                >
                  <span className="flex items-center gap-2 truncate">
                    <currentStatusOption.icon className="w-4 h-4 shrink-0 text-muted-foreground" />
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
                      {REPORT_STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => { setStatusFilter(opt.key); setStatusOpen(false); }}
                          className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 text-xs font-medium transition-colors ${statusFilter === opt.key ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-secondary'}`}
                        >
                          <opt.icon className={`w-4 h-4 shrink-0 ${statusFilter === opt.key ? 'text-primary' : 'text-muted-foreground'}`} />
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            ) : observations.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Siz hali muammo haqida xabar yubormadingiz</p>
              </motion.div>
            ) : filteredObservations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Tanlangan filtrlarga mos arizalar topilmadi</p>
              </div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                {filteredObservations.map((obs) => {
                  const activeIdx = getActiveIdx(obs.status);
                  const isRejected = obs.status === 'rejected';
                  const steps = isRejected
                    ? [{ key: 'created', icon: Clock }, { key: 'rejected', icon: XCircle }]
                    : TIMELINE_KEYS.map(k => ({ key: k, icon: TIMELINE_ICONS[k] }));

                  return (
                    <motion.button
                      key={obs.id}
                      variants={fadeUp}
                      onClick={() => setSelectedObs(obs)}
                      whileTap={{ scale: 0.98 }}
                      className="w-full bg-secondary rounded-2xl p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">{obs.objectName}</p>
                          <p className="text-sm font-semibold text-foreground mt-0.5">{obs.category}</p>
                        </div>
                        <ObservationStatusBadge status={obs.status} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-3">{obs.text}</p>

                      {/* Horizontal inline timeline */}
                      <div className="flex items-center gap-0">
                        {steps.map((st, idx) => {
                          const done = idx <= activeIdx;
                          const isReject = st.key === 'rejected';
                          const Icon = st.icon;
                          return (
                            <div key={st.key} className="flex items-center">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isReject && done ? 'bg-destructive' :
                                done ? 'bg-primary' : 'bg-border'
                              }`}>
                                <Icon className={`w-2.5 h-2.5 ${done ? 'text-white' : 'text-muted-foreground/40'}`} />
                              </div>
                              {idx < steps.length - 1 && (
                                <div className={`w-6 h-0.5 ${idx < activeIdx ? 'bg-primary' : 'bg-border'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Logout */}
        <div className="px-4 pb-8">
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-2xl border border-destructive/30 text-destructive font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <LogOut className="w-4 h-4" />
            Chiqish
          </button>
        </div>

        <AnimatePresence>
          {selectedObs && (
            <ReportDetailSheet observation={selectedObs} onClose={() => setSelectedObs(null)} />
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}
