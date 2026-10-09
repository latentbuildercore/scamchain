'use client';

import React, { useState, useMemo } from 'react';
import { Campaign } from '@/types';
import { CampaignCard } from './CampaignCard';
import { Search, Layers, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CampaignListProps {
  initialCampaigns: Campaign[];
}

export function CampaignList({ initialCampaigns }: CampaignListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { t } = useLanguage();

  const filteredCampaigns = useMemo(() => {
    return initialCampaigns.filter((campaign) => {
      // Status filter
      if (statusFilter !== 'all' && campaign.status !== statusFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = campaign.code.toLowerCase().includes(query);
        const matchesName = campaign.name.toLowerCase().includes(query);
        const matchesDesc = campaign.description.toLowerCase().includes(query);
        const matchesBrand = campaign.targetedBrands.some((b) =>
          b.toLowerCase().includes(query)
        );
        const matchesKit = campaign.kitFingerprint?.toLowerCase().includes(query);

        return matchesCode || matchesName || matchesDesc || matchesBrand || matchesKit;
      }

      return true;
    });
  }, [initialCampaigns, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: initialCampaigns.length,
      active: initialCampaigns.filter((c) => c.status === 'active').length,
      emerging: initialCampaigns.filter((c) => c.status === 'emerging').length,
      monitoring: initialCampaigns.filter((c) => c.status === 'monitoring').length,
    };
  }, [initialCampaigns]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-cyan-300 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.campaigns.filterAll} ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.campaigns.filterActive} ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('emerging')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'emerging'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.campaigns.filterEmerging} ({counts.emerging})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('monitoring')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              statusFilter === 'monitoring'
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.campaigns.filterMonitoring} ({counts.monitoring})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-auto sm:min-w-[260px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.campaigns.searchPlaceholder}
            className="w-full rounded-xl border border-slate-800 bg-slate-950/80 pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* Campaign Cards Grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        /* Empty Filter State */
        <div className="card-glass rounded-2xl p-12 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-mono font-semibold text-slate-200">
            {t.campaigns.emptySearch}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {t.common.demoNote}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:underline pt-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.campaigns.clearFilters}</span>
          </button>
        </div>
      )}
    </div>
  );
}
