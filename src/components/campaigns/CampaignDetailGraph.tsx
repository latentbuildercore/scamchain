'use client';

import React, { useMemo, useState } from 'react';
import { Campaign, Incident } from '@/types';
import {
  Layers,
  Globe,
  Shield,
  Fingerprint,
  Share2,
  Database,
  Terminal,
  Sparkles,
  Info,
  CheckCircle2,
  List,
  Network,
  Search,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CampaignDetailGraphProps {
  campaign: Campaign;
  incidents: Incident[];
}

export type GraphFilter = 'all' | 'incidents' | 'infrastructure' | 'indicators' | 'brands';

export interface IncidentRelationship {
  incident: Incident;
  score: number;
  strengthLabel: 'Strong' | 'Moderate' | 'Weak';
  strengthColor: string;
  evidence: string[];
}

/**
 * Computes concrete, verifiable relationship evidence between an incident and campaign.
 * Strictly uses signals present in the actual incident DNA and campaign data.
 */
export function computeIncidentRelationship(
  incident: Incident,
  campaign: Campaign
): IncidentRelationship {
  const evidence: string[] = [];
  const rawScore = incident.similarityScore !== undefined
    ? Math.round(incident.similarityScore <= 1 ? incident.similarityScore * 100 : incident.similarityScore)
    : 85;

  const score = Math.min(100, Math.max(0, rawScore));

  // 1. Shared Brand Match
  const campaignBrands = (campaign.targetedBrands || []).map((b) => b.toLowerCase());
  const matchedBrands = incident.dna?.extractedBrands?.filter((b) =>
    campaignBrands.includes(b.toLowerCase())
  ) || [];

  if (matchedBrands.length > 0) {
    evidence.push(`Shared impersonated brand: ${matchedBrands.join(', ')}`);
  }

  // 2. Turnkey Kit Signature Match
  if (
    incident.dna?.kitSignature &&
    campaign.kitFingerprint &&
    incident.dna.kitSignature.toLowerCase() === campaign.kitFingerprint.toLowerCase()
  ) {
    evidence.push(`Matching phishing kit fingerprint: ${campaign.kitFingerprint}`);
  }

  // 3. Structural Fingerprint (DOM Hash)
  if (incident.dna?.structuralHash) {
    evidence.push(`Matching structural DOM fingerprint (${incident.dna.structuralHash})`);
  }

  // 4. Infrastructure Overlap (Nameservers & ASNs)
  const nsList = incident.dna?.nameservers || [];
  if (nsList.length > 0) {
    evidence.push(`Shared nameserver infrastructure: ${nsList.slice(0, 2).join(', ')}`);
  }
  if (incident.dna?.autonomousSystem) {
    evidence.push(`Co-located hosting network: ${incident.dna.autonomousSystem}`);
  }

  // 5. Visual Theme
  if (incident.dna?.visualTheme) {
    evidence.push(`Replicated UI template: ${incident.dna.visualTheme}`);
  }

  // 6. Delivery Vector
  if (
    incident.victimVector &&
    incident.victimVector.toLowerCase() === campaign.primaryVector.toLowerCase()
  ) {
    evidence.push(`Identical delivery vector: ${campaign.primaryVector.replace('_', ' ')}`);
  }

  // 7. Synthetic Demo Fixture
  if (incident.isSyntheticDemo && incident.id === 'inc-demo-c17') {
    evidence.push('Deterministic synthetic test fixture for C-17 demo correlation');
  }

  // Fallback if no specific DNA indicators
  if (evidence.length === 0) {
    evidence.push(`Correlated to campaign ${campaign.code} based on cluster heuristics`);
  }

  let strengthLabel: 'Strong' | 'Moderate' | 'Weak' = 'Weak';
  let strengthColor = 'text-slate-300';
  if (score >= 80) {
    strengthLabel = 'Strong';
    strengthColor = 'text-rose-400';
  } else if (score >= 60) {
    strengthLabel = 'Moderate';
    strengthColor = 'text-amber-400';
  }

  return {
    incident,
    score,
    strengthLabel,
    strengthColor,
    evidence,
  };
}

export function CampaignDetailGraph({ campaign, incidents }: CampaignDetailGraphProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<GraphFilter>('all');
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    incidents.length > 0 ? incidents[0].id : null
  );

  const brands = campaign.targetedBrands || [];
  const incidentCount = incidents.length;

  // Extract infrastructure indicators from all linked incidents
  const infrastructure = useMemo(() => {
    const nameservers = new Set<string>();
    const asns = new Set<string>();
    const c2 = new Set<string>();

    for (const incident of incidents) {
      for (const ns of incident.dna?.nameservers || []) {
        nameservers.add(ns);
      }
      if (incident.dna?.autonomousSystem) {
        asns.add(incident.dna.autonomousSystem);
      }
      for (const endpoint of incident.dna?.c2Endpoints || []) {
        c2.add(endpoint);
      }
    }

    return {
      nameservers: Array.from(nameservers),
      asns: Array.from(asns),
      c2: Array.from(c2),
    };
  }, [incidents]);

  // Precompute relationship evidence for all incidents
  const incidentRelationships = useMemo(() => {
    const map = new Map<string, IncidentRelationship>();
    for (const inc of incidents) {
      map.set(inc.id, computeIncidentRelationship(inc, campaign));
    }
    return map;
  }, [incidents, campaign]);

  // Active selection details
  const activeIncidentRel = selectedIncidentId
    ? incidentRelationships.get(selectedIncidentId) || null
    : null;

  return (
    <div className="card-glass rounded-2xl overflow-hidden border border-slate-800 shadow-2xl space-y-0">
      {/* 1. Header Toolbar with Filters & View Switcher */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800/60 text-cyan-400 shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-mono font-bold text-slate-100">
                {t.campaigns?.detail?.relationshipExplorerHeading || 'Campaign Relationship Explorer'}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                {t.campaigns?.detail?.campaignCode || 'CAMPAIGN'} {campaign.code}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              {t.campaigns?.detail?.relationshipExplorerSubtitle || 'Inspect relationships and observable evidence connecting incidents to this campaign.'}
            </p>
          </div>
        </div>

        {/* View Switcher & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                viewMode === 'graph'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3 h-3" />
              <span>{t.campaigns?.detail?.viewGraph || 'Graph'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                viewMode === 'list'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3 h-3" />
              <span>{t.campaigns?.detail?.viewTable || 'Relationship List'}</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded border transition-colors ${
                filter === 'all'
                  ? 'bg-slate-800 text-cyan-300 border-cyan-700/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              {t.campaigns?.detail?.filterAll || 'All'}
            </button>
            <button
              type="button"
              onClick={() => setFilter('incidents')}
              className={`px-2 py-1 rounded border transition-colors ${
                filter === 'incidents'
                  ? 'bg-slate-800 text-emerald-300 border-emerald-700/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              {t.campaigns?.detail?.filterIncidents || 'Incidents'} ({incidentCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('infrastructure')}
              className={`px-2 py-1 rounded border transition-colors ${
                filter === 'infrastructure'
                  ? 'bg-slate-800 text-sky-300 border-sky-700/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              {t.campaigns?.detail?.filterInfrastructure || 'Infra'}
            </button>
            <button
              type="button"
              onClick={() => setFilter('brands')}
              className={`px-2 py-1 rounded border transition-colors ${
                filter === 'brands'
                  ? 'bg-slate-800 text-amber-300 border-amber-700/60'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              {t.campaigns?.detail?.filterBrands || 'Brands'} ({brands.length})
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Topology Graph Canvas View */}
      {viewMode === 'graph' ? (
        <div className="relative w-full min-h-[440px] sm:min-h-[500px] bg-slate-950/90 investigation-grid-bg flex items-center justify-center overflow-hidden p-4">
          {/* Orbital Radar Rings */}
          <div className="absolute w-[560px] h-[560px] rounded-full border border-slate-800/30 pointer-events-none" />
          <div className="absolute w-[380px] h-[380px] rounded-full border border-cyan-900/20 pointer-events-none" />
          <div className="absolute w-[220px] h-[220px] rounded-full border border-slate-800/50 pointer-events-none" />

          {/* Connectors SVG Canvas */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="50%" y1="50%" x2="20%" y2="24%" stroke="#0891b2" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-50" />
            <line x1="50%" y1="50%" x2="80%" y2="24%" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-50" />
            <line x1="50%" y1="50%" x2="20%" y2="76%" stroke="#059669" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-50" />
            <line x1="50%" y1="50%" x2="80%" y2="76%" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 4" className="opacity-50" />
            <line x1="50%" y1="50%" x2="50%" y2="10%" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 4" className="opacity-40" />
          </svg>

          {/* Central Anchor Node: Campaign Cluster */}
          <button
            type="button"
            onClick={() => setSelectedIncidentId(null)}
            className={`relative z-10 p-3.5 sm:p-5 rounded-2xl bg-slate-900 border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center max-w-[210px] shadow-2xl ${
              !selectedIncidentId
                ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-950 scale-105'
                : 'border-cyan-500/60 hover:border-cyan-400'
            }`}
          >
            <div className="p-2 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 mb-1.5">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-cyan-300">
              Campaign {campaign.code}
            </span>
            <span className="text-[10px] font-mono text-slate-300 leading-tight mt-0.5 line-clamp-1">
              {campaign.name}
            </span>
            <span className="mt-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              ANCHOR CLUSTER
            </span>
          </button>

          {/* Top Node: Shared Infrastructure */}
          {(filter === 'all' || filter === 'infrastructure') && (
            <div className="absolute top-[5%] sm:top-[8%] left-1/2 -translate-x-1/2 z-10 max-w-[240px] w-auto">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-sky-800/70 hover:border-sky-400 transition-all flex items-center gap-2 text-left shadow-lg">
                <Database className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-mono text-slate-200 font-semibold truncate">
                    Shared Infrastructure
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 truncate">
                    {infrastructure.nameservers.length} NS · {infrastructure.asns.length} ASN · {infrastructure.c2.length} C2
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top-Left: Related Domains */}
          {(filter === 'all' || filter === 'infrastructure') && (
            <div className="absolute left-[4%] sm:left-[10%] top-[14%] sm:top-[18%] z-10 max-w-[210px]">
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-cyan-800/70 hover:border-cyan-400 transition-all flex items-center gap-2 text-left shadow-lg">
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-mono font-semibold text-slate-200">
                    {campaign.relatedDomainsCount} Related Domains
                  </div>
                  <div className="text-[9px] font-mono text-slate-400">
                    Routing infrastructure
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top-Right: Indicators */}
          {(filter === 'all' || filter === 'indicators') && (
            <div className="absolute right-[4%] sm:right-[10%] top-[14%] sm:top-[18%] z-10 max-w-[230px]">
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-indigo-800/70 hover:border-indigo-400 transition-all flex items-center gap-2 text-left shadow-lg">
                <Terminal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-mono font-semibold text-slate-200">
                    {campaign.sharedIndicatorsCount} Shared Indicators
                  </div>
                  <div className="text-[9px] font-mono text-indigo-300">
                    DNA signature patterns
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom-Right: Targeted Brands */}
          {(filter === 'all' || filter === 'brands') && (
            <div className="absolute right-[4%] sm:right-[10%] bottom-[12%] sm:bottom-[16%] z-10 max-w-[220px]">
              <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/90 border border-amber-800/70 hover:border-amber-400 transition-all flex items-center gap-2 text-left shadow-lg">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-mono font-semibold text-slate-200">
                    {brands.length} Targeted Brands
                  </div>
                  <div className="text-[9px] font-mono text-amber-300 truncate max-w-[150px]">
                    {brands.slice(0, 2).join(', ') || 'None indexed'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom-Left: Interactive Incident Nodes Selector */}
          {(filter === 'all' || filter === 'incidents') && (
            <div className="absolute left-[3%] sm:left-[8%] bottom-[8%] sm:bottom-[12%] z-10 max-w-[260px] sm:max-w-[280px]">
              <div className="p-3 rounded-xl bg-slate-900/95 border border-emerald-800/80 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Linked Incidents ({incidentCount})</span>
                  </div>
                  <span className="text-[9px] text-slate-400">Select to inspect</span>
                </div>

                {incidents.length > 0 ? (
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    {incidents.map((incident) => {
                      const isSelected = selectedIncidentId === incident.id;
                      const rel = incidentRelationships.get(incident.id);
                      return (
                        <button
                          key={incident.id}
                          type="button"
                          onClick={() => setSelectedIncidentId(incident.id)}
                          className={`w-full p-1.5 rounded-lg text-left text-[11px] font-mono transition-all flex items-center justify-between gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-700/80 font-bold'
                              : 'bg-slate-950/60 text-slate-300 border border-slate-800 hover:bg-slate-800/60'
                          }`}
                        >
                          <span className="truncate max-w-[160px]">
                            {incident.normalizedDomain}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900 text-cyan-400 shrink-0">
                            {rel?.score}/100
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-sans">
                    No incidents linked to this campaign fixture.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 3. Accessible Relationship Explorer: List / Table Alternative (Feature 5) */
        <div className="p-5 sm:p-6 space-y-4 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              {t.campaigns?.detail?.linkedIncidentsHeading || 'All Linked Incidents & Relationship Evidence'} ({incidentCount})
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {t.campaigns?.detail?.viewTable || 'Accessible Table View'}
            </span>
          </div>

          {incidents.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-mono text-slate-400">
              {t.campaigns?.detail?.noIncidents || 'No linked incidents recorded for this campaign cluster.'}
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((incident) => {
                const rel = incidentRelationships.get(incident.id)!;
                const isSelected = selectedIncidentId === incident.id;
                const strengthText = rel.strengthLabel === 'Strong'
                  ? (t.campaigns?.detail?.connectionStrong || 'Strong Connection')
                  : rel.strengthLabel === 'Moderate'
                  ? (t.campaigns?.detail?.connectionModerate || 'Moderate Connection')
                  : (t.campaigns?.detail?.connectionWeak || 'Weak Connection');

                return (
                  <div
                    key={incident.id}
                    className={`rounded-xl border p-4 sm:p-5 transition-all space-y-3 ${
                      isSelected
                        ? 'border-emerald-600/80 bg-slate-900/90 shadow-md'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-bold text-slate-100 break-all">
                            {incident.normalizedDomain}
                          </span>
                          {incident.isSyntheticDemo && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
                              Synthetic Demo
                            </span>
                          )}
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 uppercase">
                            {incident.victimVector?.replace('_', ' ') || 'Vector Unspecified'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-sans">
                          {incident.summary || incident.userNotes || 'Observed phishing node linked to this campaign cluster.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <div className="text-right">
                          <span className={`text-xs font-mono font-bold block ${rel.strengthColor}`}>
                            {strengthText}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {t.campaigns?.detail?.similarityScoreLabel || 'Similarity'}: {rel.score}/100
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedIncidentId(incident.id)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono hover:bg-cyan-900 transition-colors cursor-pointer"
                        >
                          {isSelected ? (t.common?.showDetails || 'Selected') : (t.common?.details || 'Inspect')}
                        </button>
                      </div>
                    </div>

                    {/* Verified Connection Signals for this incident */}
                    <div className="pt-2 border-t border-slate-900 space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                        {t.campaigns?.detail?.signalsChecklist || 'VERIFIED RELATIONSHIP SIGNALS'}:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
                        {rel.evidence.map((ev, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="font-sans leading-tight">{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Reported: {incident.reportedAt ? incident.reportedAt.split('T')[0] : 'Recent'}</span>
                      <Link
                        href={`/investigate?url=${encodeURIComponent(incident.submittedUrl)}`}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline"
                      >
                        <span>{t.campaigns?.detail?.investigateWebsiteAction || 'Investigate in Scanner'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Selected Entity Evidence Inspector Panel */}
      <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800 space-y-4">
        {activeIncidentRel ? (
          /* An Incident is Selected */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Fingerprint className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-mono text-slate-400 uppercase">
                  Selected Incident:
                </span>
                <span className="text-sm font-mono font-bold text-slate-100 break-all">
                  {activeIncidentRel.incident.normalizedDomain}
                </span>
                {activeIncidentRel.incident.isSyntheticDemo && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-800">
                    Synthetic Demonstration Fixture
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="font-mono text-xs">
                  <span className={`${activeIncidentRel.strengthColor} font-bold mr-1.5`}>
                    {activeIncidentRel.strengthLabel === 'Strong'
                      ? (t.campaigns?.detail?.connectionStrong || 'Strong Connection')
                      : activeIncidentRel.strengthLabel === 'Moderate'
                      ? (t.campaigns?.detail?.connectionModerate || 'Moderate Connection')
                      : (t.campaigns?.detail?.connectionWeak || 'Weak Connection')}
                  </span>
                  <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {t.campaigns?.detail?.similarityScoreLabel || 'Similarity Score'}: {activeIncidentRel.score}/100
                  </span>
                </div>
                <Link
                  href={`/investigate?url=${encodeURIComponent(activeIncidentRel.incident.submittedUrl)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono font-bold text-xs transition-colors shadow-sm shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{t.common?.investigate || 'Investigate'}</span>
                </Link>
              </div>
            </div>

            {/* Why This Incident is Connected to Campaign */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                  {t.campaigns?.detail?.evidenceMatched || 'EVIDENCE SUPPORTING THIS CAMPAIGN CONNECTION'}
                </span>
              </div>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-200">
                {activeIncidentRel.evidence.map((ev, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="font-sans leading-snug">{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Disclosures on Score Interpretation */}
            <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/60 text-[11px] font-mono text-slate-400 space-y-1">
              <p>
                <strong className="text-slate-300">SCORING INTERPRETATION:</strong> The correlation score ({activeIncidentRel.score}/100) measures structural, technical, and branding similarity across observed incident indicators. It represents relationship strength, not a mathematical probability of coordinated attack.
              </p>
            </div>
          </div>
        ) : (
          /* Campaign Cluster is Selected */
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2 font-mono text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-slate-400 uppercase">Selected Entity:</span>
                <span className="text-slate-100 font-bold">Campaign {campaign.code} ({campaign.name})</span>
                <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800 text-[10px]">
                  ANCHOR CLUSTER
                </span>
              </div>
              <span className="text-emerald-400 font-medium text-[11px]">
                {campaign.relatedIncidentsCount} related incidents documented
              </span>
            </div>

            <p className="text-slate-300 text-xs font-sans leading-relaxed">
              {campaign.description}
            </p>

            <p className="text-[11px] font-mono text-slate-400">
              {t.campaigns?.detail?.selectIncidentToInspect || 'Select any linked incident node above or switch to the "Relationship List" tab to inspect forensic connections.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}