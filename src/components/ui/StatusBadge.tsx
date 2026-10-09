import React from 'react';
import { ThreatStatus } from '@/types';

interface StatusBadgeProps {
  status: ThreatStatus | 'critical' | 'high' | 'medium' | 'low' | 'synthetic' | string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export function StatusBadge({ status, size = 'sm', pulse = false }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  let styles = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let label = status;

  switch (normalized) {
    case 'active':
    case 'critical':
      styles = 'bg-rose-950/40 text-rose-300 border-rose-800/60';
      dotColor = 'bg-rose-500';
      label = normalized === 'active' ? 'Active Threat' : 'Critical';
      break;
    case 'emerging':
    case 'high':
      styles = 'bg-amber-950/40 text-amber-300 border-amber-800/60';
      dotColor = 'bg-amber-400';
      label = normalized === 'emerging' ? 'Emerging Wave' : 'High Risk';
      break;
    case 'monitoring':
    case 'medium':
      styles = 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60';
      dotColor = 'bg-cyan-400';
      label = normalized === 'monitoring' ? 'Under Monitoring' : 'Medium';
      break;
    case 'neutralized':
    case 'archived':
    case 'low':
      styles = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60';
      dotColor = 'bg-emerald-400';
      label = normalized === 'neutralized' ? 'Neutralized' : normalized === 'low' ? 'Low' : 'Archived';
      break;
    case 'synthetic':
    case 'demo':
      styles = 'bg-indigo-950/40 text-indigo-300 border-indigo-800/60';
      dotColor = 'bg-indigo-400';
      label = 'Synthetic Demo';
      break;
    default:
      styles = 'bg-slate-800/60 text-slate-300 border-slate-700/60';
      dotColor = 'bg-slate-400';
      label = status;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-xs sm:text-sm font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-wide ${sizeClasses} ${styles}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span className="capitalize">{label}</span>
    </span>
  );
}
