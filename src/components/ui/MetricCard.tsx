import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: string;
  accent?: 'cyan' | 'rose' | 'amber' | 'emerald' | 'indigo' | 'slate';
}

export function MetricCard({
  label,
  value,
  subtext,
  icon,
  badge,
  accent = 'cyan',
}: MetricCardProps) {
  const accentBorder = {
    cyan: 'hover:border-cyan-500/40 focus-within:border-cyan-500/40',
    rose: 'hover:border-rose-500/40 focus-within:border-rose-500/40',
    amber: 'hover:border-amber-500/40 focus-within:border-amber-500/40',
    emerald: 'hover:border-emerald-500/40 focus-within:border-emerald-500/40',
    indigo: 'hover:border-indigo-500/40 focus-within:border-indigo-500/40',
    slate: 'hover:border-slate-500/40 focus-within:border-slate-500/40',
  }[accent];

  const accentText = {
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    indigo: 'text-indigo-400',
    slate: 'text-slate-300',
  }[accent];

  return (
    <div
      className={`card-glass relative rounded-xl p-4 sm:p-5 transition-all duration-200 group ${accentBorder}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-100 font-mono">
              {value}
            </span>
            {badge && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtext && (
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">{subtext}</p>
          )}
        </div>
        {icon && (
          <div
            className={`p-2 rounded-lg bg-slate-900/80 border border-slate-800 ${accentText} group-hover:scale-105 transition-transform`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
