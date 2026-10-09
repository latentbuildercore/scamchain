'use client';

import React from 'react';
import Link from 'next/link';
import { Campaign, Incident } from '@/types';
import { CampaignDetailGraph } from '@/components/campaigns/CampaignDetailGraph';
import { EvidenceCard } from '@/components/ui/EvidenceCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  ArrowLeft,
  Fingerprint,
  Layers,
  Search,
  ExternalLink,
  Cpu,
} from 'lucide-react';

interface CampaignDetailPageContentProps {
  campaign: Campaign;
  linkedIncidents: Incident[];
}

export function CampaignDetailPageContent({
  campaign,
  linkedIncidents,
}: CampaignDetailPageContentProps) {
  const { t } = useLanguage();

  return (
    <div className="flex-1 w-full investigation-grid-bg py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/campaigns"
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.campaigns?.detail?.backToDirectory || 'Back to Campaign Directory'}</span>
          </Link>

          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            {t.common?.demoNote || 'Demo environment — simulated record'}
          </span>
        </div>

        {/* Campaign Header Profile */}
        <div className="card-glass rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                  {t.campaigns?.detail?.campaignCode || 'Campaign'} {campaign.code}
                </span>
                <StatusBadge status={campaign.status} size="md" pulse={campaign.status === 'active'} />
                <StatusBadge status={campaign.threatLevel} size="md" />
              </div>

              <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-100">
                {campaign.name}
              </h1>

              <p className="text-sm text-slate-400 max-w-3xl leading-relaxed">
                {campaign.description}
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href="/investigate"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs px-4 py-2.5 transition-colors shadow-md"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t.investigate?.modes?.url || 'Investigate New URL'}</span>
              </Link>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900">
              <span className="text-slate-400 block text-[10px] uppercase">
                {t.campaigns?.incidentsCount || 'Related Incidents'}
              </span>
              <span className="text-xl font-bold text-slate-200 mt-0.5 block">
                {campaign.relatedIncidentsCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900">
              <span className="text-slate-400 block text-[10px] uppercase">
                {t.campaigns?.detail?.filterInfrastructure || 'Related Domains'}
              </span>
              <span className="text-xl font-bold text-cyan-400 mt-0.5 block">
                {campaign.relatedDomainsCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900">
              <span className="text-slate-400 block text-[10px] uppercase">
                {t.campaigns?.detail?.threatIndicatorsHeading || 'Shared Indicators'}
              </span>
              <span className="text-xl font-bold text-amber-400 mt-0.5 block">
                {campaign.sharedIndicatorsCount}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900">
              <span className="text-slate-400 block text-[10px] uppercase">First Observed</span>
              <span className="text-sm font-semibold text-slate-300 mt-1 block">
                {campaign.firstSeen}
              </span>
            </div>
          </div>

          {/* Targeted Brands & Kit Profile */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">
                {t.campaigns?.targeting || 'Targeted Brands:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {campaign.targetedBrands.map((brand) => (
                  <span
                    key={brand}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-semibold"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>

            {campaign.kitFingerprint && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Kit Signature:</span>
                <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/60 text-indigo-300">
                  {campaign.kitFingerprint}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 1. Threat Topology Graph Area */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>{t.campaigns?.detail?.relationshipExplorerHeading || 'Attack Infrastructure Threat Graph'}</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              {t.campaigns?.detail?.evidenceMatched || 'Correlated campaign evidence'}
            </span>
          </div>

          <CampaignDetailGraph campaign={campaign} incidents={linkedIncidents} />
        </div>

        {/* 2. Shared Indicators & Forensic Signals */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>
                {t.campaigns?.detail?.observableEvidenceHeading || 'Shared Observable Indicators & Website DNA'} ({campaign.indicators?.length || 0})
              </span>
            </h2>
            <span className="text-xs font-mono text-cyan-400">
              Normalized Evidence Vectors
            </span>
          </div>

          {campaign.indicators && campaign.indicators.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaign.indicators.map((indicator) => (
                <EvidenceCard key={indicator.id} indicator={indicator} />
              ))}
            </div>
          ) : (
            <div className="card-glass rounded-xl p-6 text-center text-xs font-mono text-slate-400">
              {t.campaigns?.detail?.noIncidents || 'No specific indicators indexed for this synthetic fixture.'}
            </div>
          )}
        </div>

        {/* 3. Linked Incident Reports */}
        {linkedIncidents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-emerald-400" />
                <span>
                  {t.campaigns?.detail?.linkedIncidentsHeading || 'Linked Incident Records'} ({linkedIncidents.length})
                </span>
              </h2>
              <span className="text-xs font-mono text-emerald-400">
                Correlated Victim Leads
              </span>
            </div>

            <div className="space-y-3">
              {linkedIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="card-glass rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-bold">{incident.normalizedDomain}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase">
                        {incident.victimVector?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-sans">
                      {incident.summary || incident.userNotes}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <span className="text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded text-[11px]">
                      {t.campaigns?.detail?.similarityScoreLabel || 'Similarity'}: {Math.round((incident.similarityScore || 0.9) * 100)}/100
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {incident.reportedAt?.split('T')[0]}
                    </span>
                    <Link
                      href={`/investigate?url=${encodeURIComponent(incident.submittedUrl)}`}
                      className="text-cyan-400 hover:text-cyan-300 hover:underline text-[11px] flex items-center gap-1"
                    >
                      <span>{t.common?.investigate || 'Investigate'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
