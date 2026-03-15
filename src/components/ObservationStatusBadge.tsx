const config: Record<string, { className: string; text: string }> = {
  pending: { className: 'bg-warning', text: "Ko'rib chiqilmoqda" },
  confirmed: { className: 'bg-primary', text: 'Tasdiqlandi' },
  in_resolution: { className: 'bg-warning', text: 'Hal qilinmoqda' },
  resolved: { className: 'bg-success', text: 'Hal qilindi' },
  rejected: { className: 'bg-destructive', text: 'Rad etildi' },
};

export default function ObservationStatusBadge({ status }: { status: string }) {
  const { className, text } = config[status] || config.pending;
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary border border-border shrink-0">
      <div className={`w-2 h-2 rounded-full ${className}`} />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{text}</span>
    </div>
  );
}
