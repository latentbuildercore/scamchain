'use client';

import React, { useState } from 'react';
import {
  Globe,
  Layers,
  Fingerprint,
  ArrowRight,
  Database,
  ExternalLink,
  Sparkles,
  Workflow,
  Cpu,
} from 'lucide-react';
import Link from 'next/link';

interface NodeData {
  id: string;
  step: number;
  label: string;
  category: string;
  value: string;
  metadata: string;
  icon: React.ReactNode;
  color: string;
}

export function ThreatGraphPreview() {
  const [activeNode, setActiveNode] = useState<string>('campaign');

  const nodes: NodeData[] = [
    {
      id: 'incident',
      step: 1,
      label: 'New Incident',
      category: 'Reported Signal',
      value: 'https://incident-report-sample.online',
      metadata: 'Suspicious landing link ingested with reported victim context',
      icon: <Fingerprint className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/50 shadow-cyan-950/50',
    },
    {
      id: 'domain',
      step: 2,
      label: 'Domain',
      category: 'Observable Infrastructure',
      value: 'Autonomous System & Nameserver Records',
      metadata: 'Host registrar lineage, SSL issuer pattern, DNS routing',
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-500/50 shadow-blue-950/50',
    },
    {
      id: 'indicators',
      step: 3,
      label: 'Shared Indicators',
      category: 'Observable Technical Signals',
      value: 'Phishing Kit & C2 Gate Signatures',
      metadata: 'Obfuscated client scripts, token relays, exfil endpoints',
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      color: 'border-indigo-500/50 shadow-indigo-950/50',
    },
    {
      id: 'campaign',
      step: 4,
      label: 'Campaign',
      category: 'Infrastructure Cluster',
      value: 'Correlated Threat Cluster (e.g. C-17)',
      metadata: 'Multi-domain threat pattern linked by identical DNA indicators',
      icon: <Layers className="w-5 h-5 text-rose-400" />,
      color: 'border-rose-500/60 shadow-rose-950/50',
    },
    {
      id: 'related',
      step: 5,
      label: 'Related Incidents',
      category: 'Historical Investigations',
      value: 'Multiple Connected Incident Reports',
      metadata: 'Prior victim reports sharing the same observed indicators',
      icon: <Database className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/50 shadow-amber-950/50',
    },
  ];

  const activeNodeData = nodes.find((n) => n.id === activeNode) || nodes[3];

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 border-y border-slate-800/60 bg-slate-950/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-xs font-mono text-cyan-400 mb-3">
            <Workflow className="w-3.5 h-3.5" />
            <span>THREAT GRAPH PREVIEW</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-mono">
            How SCAMCHAIN Reconstructs The Attack
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
            Isolated scanners evaluate URLs in silos. SCAMCHAIN maps observable technical signals
            to expose the coordinated campaign infrastructure behind them.
          </p>
        </div>

        {/* Visual Graph Pipeline */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative z-10">
            {nodes.map((node, index) => {
              const isSelected = activeNode === node.id;
              return (
                <div key={node.id} className="relative flex flex-col">
                  {/* Card */}
                  <button
                    type="button"
                    onClick={() => setActiveNode(node.id)}
                    className={`text-left h-full rounded-xl p-4 sm:p-5 transition-all duration-300 relative border ${
                      isSelected
                        ? `bg-slate-900/90 ${node.color} ring-1 ring-cyan-500/40 shadow-xl scale-[1.02]`
                        : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                          {node.icon}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                          Phase 0{node.step}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 font-mono">
                      {node.label}
                    </h3>

                    <p className="mt-1 text-xs font-mono text-cyan-400/90">
                      {node.category}
                    </p>

                    <div className="mt-3 p-2 rounded bg-slate-950/80 border border-slate-900 font-mono text-xs text-slate-300 truncate">
                      {node.value}
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                      {node.metadata}
                    </p>
                  </button>

                  {/* Connecting Arrow for Desktop */}
                  {index < nodes.length - 1 && (
                    <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                      <div className="p-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 shadow-md">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                  {/* Connecting Arrow for Mobile */}
                  {index < nodes.length - 1 && (
                    <div className="lg:hidden flex justify-center py-1">
                      <span className="text-slate-400 text-xs font-mono">↓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Inspection Drawer for preview */}
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <div>
                  <h4 className="text-sm font-mono font-semibold text-slate-200">
                    Threat Graph Node Inspection Preview
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Selected: {activeNodeData.label} — {activeNodeData.category}
                  </p>
                </div>
              </div>

              <Link
                href="/campaigns"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span>Explore Threat Clusters</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">OBSERVED ENTITY</span>
                <span className="text-slate-200 font-semibold break-all">
                  {activeNodeData.value}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">ANALYSIS STAGE</span>
                <span className="text-cyan-400">
                  Observable DNA Extraction → Indicator Correlation
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-400 block mb-1">GRAPH STATUS</span>
                <span className="text-slate-300">
                  Visual Architecture Preview
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
