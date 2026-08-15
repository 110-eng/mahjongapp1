export function DecorativeDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-gold-400 ${className}`}>
      <span className="h-px flex-1 bg-gold-400/40" />
      <span className="text-xs">◈</span>
      <span className="h-px flex-1 bg-gold-400/40" />
    </div>
  );
}
