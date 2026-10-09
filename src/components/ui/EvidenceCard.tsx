import React from 'react';
import { Indicator } from '@/types';
import { Fingerprint, Globe, Shield, Terminal, Hash, Link as LinkIcon } from 'lucide-react';

interface EvidenceCardProps {
  indicator: Indicator;
}

export function EvidenceCard({ indicator }: EvidenceCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'dns':
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'ssl_certificate':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'kit_fingerprint':
      case 'html_structure':
        return <Terminal className="w-4 h-4 text-indigo-400" />;
      case 'telegram_c2':
      case 'payment_gateway':
        return <Hash className="w-4 h-4 text-rose-400" />;
      default:
        return <Fingerprint className="w-4 h-4 text-slate-400" />;
    }
  };

  const confidencePercent = Math.round(indicator.confidence * 100);

  return (
    <div className="card-glass rounded-xl p-4 transition-all duration-200 hover:border-slate-600/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-slate-900 border border-slate-800">
            {getCategoryIcon(indicator.category)}
          </div>
          <div>
            <h4 className="text-sm font-medium text-slate-200">
              {indicator.name}
            </h4>
            <span className="text-[11px] font-mono uppercase text-slate-400">
              {indicator.category.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 px-2 py-0.5 rounded">
            {confidencePercent}% conf
          </span>
          {indicator.sharedCount > 1 && (
            <span className="text-xs font-mono text-amber-300 bg-amber-950/40 border border-amber-800/50 px-2 py-0.5 rounded flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              {indicator.sharedCount} linked
            </span>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-900 font-mono text-xs text-slate-300 break-all select-all">
          {indicator.value}
        </div>
        {indicator.context && (
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">
            {indicator.context}
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Observed: {indicator.firstObserved}</span>
        <span>Last: {indicator.lastObserved}</span>
      </div>
    </div>
  );
}
