import { AlertTriangle } from 'lucide-react';
import type { Observation } from '@/data/infrastructure';
import ObservationStatusBadge from './ObservationStatusBadge';

interface Props {
  observation: Observation;
}

export default function ObservationCard({ observation }: Props) {
  return (
    <div className="bg-secondary rounded-2xl p-4 mb-3">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded-full">
          {observation.category}
        </span>
        <div className="flex items-center gap-2">
          {observation.status && <ObservationStatusBadge status={observation.status} />}
          <span className="text-[10px] text-muted-foreground">{observation.time}</span>
        </div>
      </div>

      <p className="text-sm text-foreground font-medium mb-3 leading-relaxed">{observation.text}</p>

      {observation.photos.length > 0 && (
        <div className="flex gap-2 mb-2">
          {observation.photos.map((photo, i) => (
            <img
              key={i}
              src={photo}
              alt={`Rasm ${i + 1}`}
              className="w-20 h-20 rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      {observation.priority >= 3 && (
        <div className="flex items-center gap-1.5 mt-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          <span className="text-[11px] font-bold text-destructive">Muhim</span>
        </div>
      )}
    </div>
  );
}
