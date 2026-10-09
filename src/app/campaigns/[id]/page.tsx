import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { dataRepository } from '@/lib/data/campaign-repository';
import { CampaignDetailPageContent } from '@/components/campaigns/CampaignDetailPageContent';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const campaigns = await dataRepository.getCampaigns();
  return campaigns.map((c) => ({
    id: c.id,
  }));
}

export async function generateMetadata({
  params,
}: CampaignDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const campaign = await dataRepository.getCampaignById(id);

  if (!campaign) {
    return {
      title: 'Campaign Not Found — SCAMCHAIN',
    };
  }

  return {
    title: `Campaign ${campaign.code} (${campaign.name}) — SCAMCHAIN`,
    description: campaign.description,
  };
}

async function CampaignDetailContent({ params }: CampaignDetailPageProps) {
  const { id } = await params;
  const campaign = await dataRepository.getCampaignById(id);

  if (!campaign) {
    notFound();
  }

  const linkedIncidents = await dataRepository.getIncidentsByCampaignId(campaign.id);

  return (
    <CampaignDetailPageContent
      campaign={campaign}
      linkedIncidents={linkedIncidents}
    />
  );
}

function CampaignDetailSkeleton() {
  return (
    <div className="flex-1 w-full investigation-grid-bg py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-4 w-48 bg-slate-800 rounded"></div>
        <div className="card-glass rounded-2xl p-6 sm:p-8 h-64 bg-slate-900/50"></div>
      </div>
    </div>
  );
}

export default function CampaignDetailPage(props: CampaignDetailPageProps) {
  return (
    <Suspense fallback={<CampaignDetailSkeleton />}>
      <CampaignDetailContent {...props} />
    </Suspense>
  );
}
