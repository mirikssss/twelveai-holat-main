import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, LogOut, FileText, Loader2, ShoppingCart, CheckCircle2, Clock, Wrench, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserObservations, type UserObservation } from '@/api/mapApi';
import ObservationStatusBadge from '@/components/ObservationStatusBadge';
import ReportDetailSheet from '@/components/ReportDetailSheet';

const TIMELINE_KEYS = ['created', 'confirmed', 'in_resolution', 'resolved'] as const;
const TIMELINE_ICONS = { created: Clock, confirmed: CheckCircle2, in_resolution: Wrench, resolved: CheckCircle2 };

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

  useEffect(() => {
    if (!isLoggedIn) { navigate('/auth', { replace: true }); return; }
    fetchUserObservations(user!.phone)
      .then(setObservations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, user, navigate]);

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const initials = user?.name ? user.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '??';

  const points = 32904;
  const maxPoints = 50000;
  const level = 2;
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
                Mening arizalarim ({observations.length})
              </h2>
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
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                {observations.map((obs) => {
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
