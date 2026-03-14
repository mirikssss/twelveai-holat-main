import { CheckCircle2 } from 'lucide-react';
import type { InfraPromise } from '@/data/infrastructure';

interface Props {
  promise: InfraPromise;
  onInspect: (p: InfraPromise) => void;
}

export default function PromiseItem({ promise, onInspect }: Props) {
  const total = promise.confirmed + promise.reported;
  const ratio = total > 0 ? (promise.confirmed / total) * 100 : 0;
  const isPerfect = ratio >= 95;

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 mr-3">
          <h4 className="font-semibold text-foreground text-sm">{promise.title}</h4>
          <p className={`text-xs font-medium ${isPerfect ? 'text-success' : 'text-muted-foreground'}`}>
            {isPerfect && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
            {promise.status}
          </p>
        </div>
        <button
          onClick={() => onInspect(promise)}
          className="bg-foreground text-background text-xs font-bold px-4 py-2 rounded-full active:scale-90 transition-transform shrink-0"
        >
          Tekshirish
        </button>
      </div>

      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
        <div style={{ width: `${ratio}%` }} className="h-full bg-success transition-all duration-500" />
        <div style={{ width: `${100 - ratio}%` }} className="h-full bg-destructive transition-all duration-500" />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-[11px] text-muted-foreground font-medium">
          <span className="text-success font-bold">{promise.confirmed}</span> Tasdiqlangan
        </span>
        <span className="text-[11px] text-muted-foreground font-medium">
          <span className="text-destructive font-bold">{promise.reported}</span> Muammo
        </span>
      </div>
    </div>
  );
}
