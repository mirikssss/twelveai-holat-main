import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Clock, AlertCircle, XCircle, Wrench } from 'lucide-react';
import ObservationStatusBadge from './ObservationStatusBadge';
import DisputeFormSheet from './DisputeFormSheet';
import { toast } from 'sonner';

interface UserObservation {
  id: string;
  objectId: number;
  objectName: string;
  category: string;
  text: string;
  createdAt: string;
  timeLabel: string;
  photos: string[];
  priority: number;
  status: string;
  confirmedAt: string | null;
  resolvedAt: string | null;
  rejectedAt: string | null;
}

interface Props {
  observation: UserObservation;
  onClose: () => void;
}

const TIMELINE_STEPS = [
  { key: 'created', label: 'Yuborildi', icon: Clock },
  { key: 'confirmed', label: 'Tasdiqlandi', icon: CheckCircle2 },
  { key: 'in_resolution', label: 'Hal qilinmoqda', icon: Wrench },
  { key: 'resolved', label: 'Hal qilindi', icon: CheckCircle2 },
];

function getActiveIdx(status: string): number {
  if (status === 'rejected') return 1;
  if (status === 'pending') return 0;
  if (status === 'confirmed') return 1;
  if (status === 'in_resolution') return 2;
  if (status === 'resolved') return 3;
  return 0;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ReportDetailSheet({ observation: obs, onClose }: Props) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const activeIdx = getActiveIdx(obs.status);
  const isRejected = obs.status === 'rejected';

  const steps = isRejected
    ? [
        { key: 'created', label: 'Yuborildi', icon: Clock },
        { key: 'rejected', label: 'Rad etildi', icon: XCircle },
      ]
    : TIMELINE_STEPS;

  const handleConfirmResolved = () => {
    toast.success("Rahmat! Muammo hal qilinganligi tasdiqlandi.");
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: '4%' }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="absolute inset-0 z-40 bg-background rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
      >
        <div className="sticky top-0 bg-background z-10 pt-2 pb-1 px-6 rounded-t-[28px]">
          <div className="w-10 h-1 bg-border rounded-full mx-auto" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{obs.objectName}</p>
              <h2 className="text-base font-bold text-foreground">{obs.category}</h2>
            </div>
            <button onClick={onClose} className="p-2 bg-secondary rounded-full shrink-0 ml-2 active:scale-90 transition-transform">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <ObservationStatusBadge status={obs.status} />

          {/* Photo */}
          {obs.photos.length > 0 && obs.photos[0] && !obs.photos[0].startsWith('data:') && (
            <div className="mt-4 rounded-2xl overflow-hidden">
              <img src={obs.photos[0]} className="w-full h-40 object-cover" alt="" />
            </div>
          )}

          {/* Text */}
          <div className="mt-4 bg-secondary rounded-2xl p-4">
            <p className="text-sm text-foreground leading-relaxed">{obs.text}</p>
            <p className="text-[10px] text-muted-foreground mt-2">{obs.timeLabel}</p>
          </div>

          {/* Timeline */}
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Holat tarixi</h3>
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />
              {steps.map((step, idx) => {
                const done = idx <= activeIdx;
                const isCurrent = idx === activeIdx;
                const isReject = step.key === 'rejected';

                let ts: string | null = null;
                if (step.key === 'created') ts = obs.createdAt;
                else if (step.key === 'confirmed') ts = obs.confirmedAt;
                else if (step.key === 'resolved') ts = obs.resolvedAt;
                else if (step.key === 'rejected') ts = obs.rejectedAt;

                return (
                  <div key={step.key} className="relative flex items-start gap-3 mb-5 last:mb-0">
                    <div className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                      isReject && done ? 'bg-destructive border-destructive' :
                      done ? (isCurrent ? 'bg-primary border-primary' : 'bg-primary/80 border-primary/80') :
                      'bg-background border-border'
                    }`}>
                      <step.icon className={`w-3 h-3 ${done ? 'text-white' : 'text-muted-foreground/40'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${done ? (isReject ? 'text-destructive' : 'text-foreground') : 'text-muted-foreground/40'}`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{done && ts ? formatDate(ts) : '—'}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resolved actions */}
          {obs.status === 'resolved' && (
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Muammo hal qilindimi?</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmResolved}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-[hsl(var(--success))] text-white active:scale-[0.97] transition-transform"
                >
                  Ha, hal qilindi
                </button>
                <button
                  onClick={() => setDisputeOpen(true)}
                  className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-[hsl(var(--destructive))] text-white active:scale-[0.97] transition-transform"
                >
                  Yo'q, muammo bor
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {disputeOpen && (
          <DisputeFormSheet
            objectName={obs.objectName}
            onClose={() => setDisputeOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
