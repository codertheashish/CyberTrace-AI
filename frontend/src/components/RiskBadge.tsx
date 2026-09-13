import clsx from 'clsx';

const STYLES: Record<string, string> = {
  LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MEDIUM: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  HIGH: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
};

export default function RiskBadge({ level }: { level: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono-tech font-semibold tracking-wide',
        STYLES[level] || STYLES.LOW
      )}
    >
      {level}
    </span>
  );
}
