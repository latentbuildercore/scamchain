'use client';

import React from 'react';
import { ShieldAlert, Layers, Flame, Radio, Database } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface IntelligenceSummaryBarProps {
  compact?: boolean;
}

export function IntelligenceSummaryBar({ compact = false }: IntelligenceSummaryBarProps) {
  const { t } = useLanguage();

  const metrics = [
    {
      label: t.summaryBar?.incidentsAnalyzed || 'INCIDENTS ANALYZED',
      value: 27,
      subtext: t.summaryBar?.incidentsSubtext || 'Reports processed by the investigation engine',
      icon: <Database className="w-4 h-4" />,
      accent: 'slate' as const,
    },
    {
      label: t.summaryBar?.campaignClusters || 'CAMPAIGN CLUSTERS',
      value: 5,
      subtext: t.summaryBar?.campaignClustersSubtext || 'Related threat patterns identified',
      icon: <Layers className="w-4 h-4" />,
      accent: 'indigo' as const,
    },
    {
      label: t.summaryBar?.activeCampaigns || 'ACTIVE CAMPAIGNS',
      value: 2,
      subtext: t.summaryBar?.activeCampaignsSubtext || 'Currently monitored clusters',
      icon: <Flame className="w-4 h-4" />,
      accent: 'rose' as const,
    },
    {
      label: t.summaryBar?.emergingCampaign || 'EMERGING CAMPAIGN',
      value: 1,
      subtext: t.summaryBar?.emergingCampaignSubtext || 'Newly forming threat pattern',
      icon: <Radio className="w-4 h-4" />,
      accent: 'amber' as const,
    },
  ];

  if (compact) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono font-medium text-slate-300">
              {t.summaryBar?.compactTitle || 'THREAT INTELLIGENCE OVERVIEW'}
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono">
            <div>
              <span className="text-slate-400">{t.summaryBar?.analyzedLabel || 'Analyzed: '}</span>
              <span className="text-slate-100 font-bold">27</span>
            </div>
            <div>
              <span className="text-slate-400">{t.summaryBar?.clustersLabel || 'Clusters: '}</span>
              <span className="text-slate-100 font-bold">5</span>
            </div>
            <div>
              <span className="text-slate-400">{t.summaryBar?.activeLabel || 'Active: '}</span>
              <span className="text-rose-400 font-bold">2</span>
            </div>
            <div>
              <span className="text-slate-400">{t.summaryBar?.emergingCampaign || 'Emerging: '}</span>
              <span className="text-amber-400 font-bold">1</span>
            </div>
          </div>

          <div className="w-full sm:w-auto text-[11px] font-mono text-slate-400">
            {t.common.demoNote || 'Demo environment — investigation records are simulated'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
            {t.summaryBar?.compactTitle || 'THREAT INTELLIGENCE OVERVIEW'}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {t.common.demoNote || 'Demo environment — investigation records are simulated'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
            icon={metric.icon}
            accent={metric.accent}
          />
        ))}
      </div>
    </div>
  );
}
