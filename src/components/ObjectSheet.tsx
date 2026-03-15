import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Droplets, Wifi, Hammer, Sun, ChevronDown, MessageSquare, ArrowUpDown, Filter, AlertCircle, Camera, Send } from 'lucide-react';
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

export default function ObjectSheet({ object, onClose, onInspect, onObjectUpdated }: Props) {
  const [tab, setTab] = useState<'overall' | 'observation'>('overall');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    object.categories.forEach((_, i) => { init[i] = i === 0; });
    return init;
  });
  const [obsFilter, setObsFilter] = useState<string>('all');
  const [obsSortImportant, setObsSortImportant] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  // When object changes (after detail load or switching object), expand first category only
  useEffect(() => {
    const cats = object.categories;
    if (cats.length === 0) return;
    setExpandedCategories(
      Object.fromEntries(cats.map((_, i) => [i, i === 0]))
    );
  }, [object.id, object.categories.length]);

  const toggleCategory = (i: number) => {
    setExpandedCategories(prev => ({ ...prev, [i]: !prev[i] }));
  };

  const obsCategories = useMemo(() => {
    const cats = new Set(object.observations.map(o => o.category));
    return Array.from(cats);
  }, [object.observations]);

  const filteredObs = useMemo(() => {
    let list = [...object.observations];
    if (obsFilter !== 'all') list = list.filter(o => o.category === obsFilter);
    if (obsSortImportant) list.sort((a, b) => b.priority - a.priority);
    return list;
  }, [object.observations, obsFilter, obsSortImportant]);

  // Backend sends newest by date; fallback to highest priority when no detail yet
  const latestObservation =
    object.latestObservation ??
    (object.observations.length > 0
      ? object.observations.reduce((a, b) => (a.priority > b.priority ? a : b))
      : null);

  const infoCards = [
    { icon: Hammer, label: "Kapital ta'mir", value: object.capitalRepair || "—" },
    { icon: Sun, label: "Svet", value: object.light ? "Bor" : "Yo'q", positive: object.light },
    { icon: Droplets, label: "Suv", value: object.water ? "Bor" : "Yo'q", positive: object.water },
    { icon: Wifi, label: "Internet", value: object.internet ? "Bor" : "Yo'q", positive: object.internet },
  ];

  return (
    <>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: "6%" }}
        exit={{ y: "100%" }}
        transition={SPRING}
        className="absolute inset-0 z-30 bg-background rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
        style={{ fontFamily: "'Wix Madefor Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
      >
        {/* Drag handle */}
        <div className="sticky top-0 bg-background z-10 pt-2 pb-1 px-6 rounded-t-[28px]">
          <div className="w-10 h-1 bg-border rounded-full mx-auto" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Hero */}
          <div className="px-4">
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

            {/* Info cards */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {infoCards.map((card, i) => (
                <div key={i} className="bg-secondary rounded-xl p-2.5 flex flex-col items-center text-center">
                  <card.icon className="w-4 h-4 text-muted-foreground mb-1" />
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                  <p className={`text-xs font-bold mt-0.5 ${
                    'positive' in card
                      ? card.positive ? "text-success" : "text-destructive"
                      : "text-foreground"
                  }`}>{card.value}</p>
                </div>
              ))}
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
                onClick={() => setTab('observation')}
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
                onClick={() => setTab('observation')}
                className={`flex-1 min-h-11 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 relative active:scale-95 ${
                  tab === 'observation' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Xabarlar
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
                  key="observation"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Filters */}
                  <div className="flex gap-2 mb-4">
                    <div className="flex items-center gap-1 flex-1">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      <select
                        value={obsFilter}
                        onChange={e => setObsFilter(e.target.value)}
                        style={{ fontFamily: 'inherit' }}
                        className="bg-secondary text-foreground text-xs font-medium rounded-lg px-2 py-1.5 border-none outline-none flex-1 min-h-11"
                      >
                        <option value="all">Barchasi</option>
                        {obsCategories.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => setObsSortImportant(!obsSortImportant)}
                      className={`flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg active:scale-95 transition-all min-h-11 ${
                        obsSortImportant ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      Muhim
                    </button>
                  </div>

                  {filteredObs.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Bu ob'ekt bo'yicha yangi xabarlar yo'q</p>
                    </div>
                  ) : (
                    filteredObs.map(obs => (
                      <ObservationCard key={obs.id} observation={obs} />
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA button - always after content, with safe bottom padding */}
            <div className="mt-auto pt-6 pb-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
              <button
                onClick={() => setReportOpen(true)}
                className="w-full min-h-11 bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform shadow-md"
              >
                <AlertCircle className="w-4 h-4" />
                Muammo haqida xabar berish
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Report problem sheet */}
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
