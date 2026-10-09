'use client';

import React from 'react';
import Link from 'next/link';
import { Campaign } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const { t } = useLanguage();

  return (
    <div className="card-glass rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20 flex flex-col justify-between group">
      <div>
        {/* Header: Code & Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-mono text-lg font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">
            {t.campaigns.detail.campaignCode} {campaign.code}
          </span>
          <StatusBadge status={campaign.status} pulse={campaign.status === 'active'} />
        </div>

        {/* Campaign Title & Description */}
        <h3 className="text-base font-semibold text-slate-100 font-mono group-hover:text-slate-50 transition-colors">
          {campaign.name}
        </h3>
        <p className="mt-2 text-xs text-slate-400 leading-relaxed line-clamp-2">
          {campaign.description}
        </p>

        {/* Targeted Brands */}
        {campaign.targetedBrands && campaign.targetedBrands.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-400 mr-1">{t.campaigns.targeting}</span>
            {campaign.targetedBrands.map((brand) => (
              <span
                key={brand}
                className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
              >
                {brand}
              </span>
            ))}
          </div>
        )}

        {/* Core Correlation Metrics */}
        <div className="mt-5 grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-center font-mono">
          <div className="p-1">
            <span className="text-[10px] text-slate-400 uppercase block">{t.campaigns.incidentsCount}</span>
            <span className="text-base font-bold text-slate-200">
              {campaign.relatedIncidentsCount}
            </span>
          </div>
          <div className="p-1 border-x border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase block">Domains</span>
            <span className="text-base font-bold text-cyan-400">
              {campaign.relatedDomainsCount}
            </span>
          </div>
          <div className="p-1">
            <span className="text-[10px] text-slate-400 uppercase block">Indicators</span>
            <span className="text-base font-bold text-amber-400">
              {campaign.sharedIndicatorsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Detail Link */}
      <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Calendar className="w-3.5 h-3.5" />
          <span>Active: {campaign.lastActive}</span>
        </div>

        <Link
          href={`/campaigns/${campaign.id}`}
          className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold group-hover:translate-x-0.5 transition-all focus:outline-none focus:underline"
        >
          <span>{t.campaigns.viewCampaign}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
