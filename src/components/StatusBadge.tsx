import type { PromiseStatus } from '@/data/infrastructure';

const config: Record<PromiseStatus, { className: string; text: string }> = {
  good: { className: 'bg-success', text: 'Yaxshi' },
  mixed: { className: 'bg-warning', text: 'Tekshirish kerak' },
  bad: { className: 'bg-destructive', text: 'Muammolar' },
  unverified: { className: 'bg-muted', text: 'Tekshirilmagan' },
};

export default function StatusBadge({ status }: { status: PromiseStatus }) {
  const { className, text } = config[status];
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary border border-border">
      <div className={`w-2 h-2 rounded-full ${className}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{text}</span>
    </div>
  );
}
