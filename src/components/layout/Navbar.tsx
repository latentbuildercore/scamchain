'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Search, Layers, Menu, X, Network, ArrowUpRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const navLinks = [
    { href: '/', label: t.nav.overview, icon: <Network className="w-4 h-4" /> },
    { href: '/investigate', label: t.nav.investigate, icon: <Search className="w-4 h-4" /> },
    { href: '/campaigns', label: t.nav.campaigns, icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded-lg p-1"
            aria-label={t.nav.homeAria}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-sm shadow-cyan-950">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-base font-bold tracking-wider text-slate-100 group-hover:text-cyan-300 transition-colors">
                SCAMCHAIN
              </span>
              <span className="text-[10px] font-mono tracking-tight text-slate-400">
                {t.common.appName.includes('(') ? t.common.appName : 'THREAT INVESTIGATION PLATFORM'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4" aria-label="Main Navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-mono font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800/90 text-cyan-300 border border-slate-700/80 shadow-inner'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action / Indicators / Language Selector */}
        <div className="hidden sm:flex items-center gap-3">
          <LanguageSelector />

          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-[11px] font-mono text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{t.common.simulatedEnv}</span>
          </div>

          <Link
            href="/investigate"
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3.5 py-1.5 text-xs font-mono font-semibold text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
          >
            <span>{t.common.newInvestigation}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile menu button & Language selector */}
        <div className="flex md:hidden items-center gap-2">
          <LanguageSelector />
          <Link
            href="/investigate"
            className="text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-700/50 px-2.5 py-1 rounded"
          >
            {t.common.investigate}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-label={t.nav.toggleMenuAria}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-mono ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2">
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-mono text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>{t.common.simulatedEnv}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
