import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, ChevronDown, AlertCircle } from 'lucide-react';
import type { InfraObject, InfraPromise, Observation } from '@/data/infrastructure';
import PromiseItem from './PromiseItem';
import ObservationCard from './ObservationCard';
import StatusBadge from './StatusBadge';
import ReportProblemSheet from './ReportProblemSheet';

const SPRING = { type: "spring" as const, damping: 25, stiffness: 200 };

interface Props {
  object: InfraObject;
  onClose: () => void;
  onInspect: (p: InfraPromise) => void;
  onObjectUpdated?: (obj: InfraObject) => void;
}

type CategoryStatus = 'gray' | 'red' | 'green';

function getCategoryStatus(observations: Observation[]): CategoryStatus {
  if (observations.length === 0) return 'gray';
  const withStatus = observations.filter(o => !!o.status);
  if (withStatus.length === 0) return 'gray';
  const unresolved = withStatus.filter(o => o.status !== 'resolved');
  if (unresolved.length === 0) return 'green';
  return 'red';
}

function getUnresolvedCount(observations: Observation[]): number {
  return observations.filter(o => o.status && o.status !== 'resolved').length;
}

const statusColorMap: Record<CategoryStatus, { bg: string; text: string; border: string }> = {
  gray: { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border' },
  red: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/20' },
  green: { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' },
};

export default function ObjectSheet({ object, onClose, onInspect, onObjectUpdated }: Props) {
  const [tab, setTab] = useState<'overall' | 'muammolar'>('overall');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    object.categories.forEach((_, i) => { init[i] = i === 0; });
    return init;
  });
  const [expandedProblemCats, setExpandedProblemCats] = useState<Record<string, boolean>>({});
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    const cats = object.categories;
    if (cats.length === 0) return;
    setExpandedCategories(Object.fromEntries(cats.map((_, i) => [i, i === 0])));
  }, [object.id, object.categories.length]);

  const toggleCategory = (i: number) => {
    setExpandedCategories(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const toggleProblemCat = (key: string) => {
    setExpandedProblemCats(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const observationsByCategory = useMemo(() => {
    const map: Record<string, Observation[]> = {};
    for (const obs of object.observations) {
      const cat = obs.category;
      if (!map[cat]) map[cat] = [];
      map[cat].push(obs);
    }
    return map;
  }, [object.observations]);

  const problemCategories = useMemo(() => {
    return Object.entries(observationsByCategory)
      .map(([category, obs]) => ({
        category,
        observations: obs,
        status: getCategoryStatus(obs),
        unresolvedCount: getUnresolvedCount(obs),
      }))
      .filter(pc => pc.status !== 'gray');
  }, [observationsByCategory]);

  const latestObservation =
    object.latestObservation ??
    (object.observations.length > 0
      ? object.observations.reduce((a, b) => (a.priority > b.priority ? a : b))
      : null);

  return (
    <>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: "6%" }}
        exit={{ y: "100%" }}
        transition={SPRING}
        className="absolute inset-0 z-30 bg-background rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
      >
        <div className="sticky top-0 bg-background z-10 pt-2 pb-1 px-6 rounded-t-[28px]">
          <div className="w-10 h-1 bg-border rounded-full mx-auto" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="px-4">
            {/* Hero */}
            <div className="relative rounded-2xl overflow-hidden mb-3">
              <img src={object.image} className="w-full h-44 object-cover" alt={object.name} />
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full text-muted-foreground active:scale-90 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-foreground tracking-tight leading-tight">{object.name}</h2>
            <div className="flex items-center gap-2 mt-1 mb-3">
              <p className="text-muted-foreground flex items-center gap-1 text-xs font-medium">
                <MapPin className="w-3 h-3" /> {object.address}
              </p>
              <StatusBadge status={object.status} />
            </div>

            {/* Collapsible summary */}
            <button
              onClick={() => setSummaryOpen(!summaryOpen)}
              className="w-full bg-secondary/60 rounded-xl p-3 mb-3 text-left active:bg-secondary transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Qisqacha ob'ekt haqida</span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${summaryOpen ? 'rotate-180' : ''}`} />
              </div>
              <AnimatePresence>
                {summaryOpen && (
                  <motion.p
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-muted-foreground mt-2 leading-relaxed overflow-hidden"
                  >
                    {object.summary}
                  </motion.p>
                )}
              </AnimatePresence>
            </button>

            {/* Latest problem alert */}
            {latestObservation ? (
              <div
                className="bg-destructive/5 border border-destructive/15 rounded-xl p-3 mb-4 cursor-pointer active:bg-destructive/10 transition-colors"
                onClick={() => setTab('muammolar')}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-destructive">So'nggi muammo</p>
                </div>
                <p className="text-sm text-foreground font-medium truncate">{latestObservation.text}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{latestObservation.time}</p>
              </div>
            ) : (
              <div className="bg-secondary/40 rounded-xl p-3 mb-4 text-center">
                <p className="text-xs text-muted-foreground">Yangi xabarlar yo'q</p>
              </div>
            )}

            {/* Tab switch */}
            <div className="flex bg-secondary rounded-xl p-1 mb-4">
              <button
                onClick={() => setTab('overall')}
                className={`flex-1 min-h-11 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 active:scale-95 ${
                  tab === 'overall' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Umumiy
              </button>
              <button
                onClick={() => setTab('muammolar')}
                className={`flex-1 min-h-11 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 relative active:scale-95 ${
                  tab === 'muammolar' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Muammolar
                {object.observations.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {object.observations.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="px-4 pb-6 min-h-[58vh] flex flex-col">
            <AnimatePresence mode="wait">
              {tab === 'overall' ? (
                <motion.div
                  key="overall"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {object.categories.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">Hali e'lon qilingan rejalar yo'q</p>
                    </div>
                  ) : (
                    object.categories.map((cat, idx) => (
                      <div key={idx} className="mb-3">
                        <button
                          onClick={() => toggleCategory(idx)}
                          className="w-full flex items-center justify-between py-2.5 bg-background active:opacity-70 transition-opacity"
                        >
                          <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            {cat.title} ({cat.promises.length})
                          </h3>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedCategories[idx] ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {expandedCategories[idx] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              {cat.promises.map(p => (
                                <PromiseItem key={p.id} promise={p} onInspect={onInspect} />
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="muammolar"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Problem category cards as accordions */}
                  {problemCategories.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">Bu ob'ekt bo'yicha muammolar yo'q</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        {problemCategories.map((pc) => {
                          const colors = statusColorMap[pc.status];
                          const isOpen = expandedProblemCats[pc.category] || false;
                          return (
                            <button
                              key={pc.category}
                              onClick={() => toggleProblemCat(pc.category)}
                              className={`${colors.bg} border ${colors.border} rounded-xl p-2.5 flex flex-col items-center text-center transition-all active:scale-95 ${isOpen ? 'ring-2 ring-primary/30' : ''}`}
                            >
                              <p className="text-[9px] font-extrabold uppercase tracking-wider text-foreground/70 leading-tight mb-1 line-clamp-2">{pc.category}</p>
                              <p className={`text-xl font-black ${colors.text}`}>
                                {pc.status === 'gray' ? '—' : pc.unresolvedCount}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {/* Expanded observations under selected category */}
                      <AnimatePresence>
                        {problemCategories.map((pc) => {
                          if (!expandedProblemCats[pc.category]) return null;
                          return (
                            <motion.div
                              key={`expanded-${pc.category}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden mb-3"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{pc.category}</h3>
                                <button onClick={() => toggleProblemCat(pc.category)} className="text-[10px] text-primary font-bold">Yopish</button>
                              </div>
                              {pc.observations.map(obs => (
                                <ObservationCard key={obs.id} observation={obs} />
                              ))}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA button */}
            <div className="mt-auto pt-6 pb-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => setReportOpen(true)}
                className="w-full min-h-11 bg-primary text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
              >
                <AlertCircle className="w-4 h-4" />
                Muammo haqida xabar berish
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {reportOpen && (
          <ReportProblemSheet
            objectName={object.name}
            objectId={object.id}
            onClose={() => setReportOpen(false)}
            onObservationAdded={(obs: Observation) => {
              if (onObjectUpdated) {
                const newObs = [obs, ...object.observations];
                onObjectUpdated({
                  ...object,
                  observations: newObs,
                  latestObservation: obs,
                });
              }
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
