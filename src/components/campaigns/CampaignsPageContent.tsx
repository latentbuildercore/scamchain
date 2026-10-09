'use client';

import React from 'react';
import { Campaign } from '@/types';
import { CampaignList } from '@/components/campaigns/CampaignList';
import { IntelligenceSummaryBar } from '@/components/ui/IntelligenceSummaryBar';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Layers } from 'lucide-react';

interface CampaignsPageContentProps {
  campaigns: Campaign[];
}

export function CampaignsPageContent({ campaigns }: CampaignsPageContentProps) {
  const { t } = useLanguage();

  return (
    <div className="flex-1 w-full investigation-grid-bg py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/80 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-3 py-1 text-xs font-mono text-indigo-300">
              <Layers className="w-3.5 h-3.5" />
              <span>{t.campaigns?.directoryBadge || 'THREAT CAMPAIGN DIRECTORY'}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono tracking-tight text-slate-100">
              {t.campaigns?.directoryTitle || 'Scam Campaign Directory'}
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              {t.campaigns?.directorySubtitle ||
                'Explore correlated attack campaigns reconstructed from normalized Website DNA signals. Each campaign links seemingly independent fraudulent websites back to shared infrastructure.'}
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-slate-900/60 border border-slate-800 p-3 rounded-xl max-w-sm">
            {t.common.demoNote || 'Demo environment — investigation records are simulated'}
          </div>
        </div>

        {/* Dashboard Intelligence Summary */}
        <div>
          <IntelligenceSummaryBar />
        </div>

        {/* Campaign List with Interactive Filter and Search */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono uppercase tracking-wider text-slate-300 font-semibold">
              {t.campaigns?.activeClusters || 'Active & Monitored Threat Clusters'}
            </h2>
            <span className="text-xs font-mono text-cyan-400">
              {campaigns.length} {t.campaigns?.recordedCount || 'Recorded Campaigns'}
            </span>
          </div>

          <CampaignList initialCampaigns={campaigns} />
        </div>
      </div>
    </div>
  );
}
