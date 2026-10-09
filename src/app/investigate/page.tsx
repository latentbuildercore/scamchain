import React from 'react';
import { Metadata } from 'next';
import { InvestigatePageContent } from '@/components/investigation/InvestigatePageContent';

export const metadata: Metadata = {
  title: 'Investigate Threats — SCAMCHAIN',
  description:
    'Submit a suspicious website URL, paste a message, or upload a screenshot. SCAMCHAIN analyzes multiple signals and looks for connections to threat campaigns.',
};

export default function InvestigatePage() {
  return <InvestigatePageContent />;
}
