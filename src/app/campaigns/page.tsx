import React from 'react';
import { Metadata } from 'next';
import { dataRepository } from '@/lib/data/campaign-repository';
import { CampaignsPageContent } from '@/components/campaigns/CampaignsPageContent';

export const metadata: Metadata = {
  title: 'Campaign Intelligence — SCAMCHAIN',
  description:
    'Directory of correlated scam campaigns, cross-domain threat infrastructure, and synthetic demonstration clusters.',
};

export default async function CampaignsPage() {
  const campaigns = await dataRepository.getCampaigns();

  return <CampaignsPageContent campaigns={campaigns} />;
}
