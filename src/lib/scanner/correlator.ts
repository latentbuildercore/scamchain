import {
  CompactWebsiteDNA,
  GeminiAnalysisResult,
  ObservedSignals,
} from '@/types';
import demoData from '@/data/demo-incidents.json';

interface CampaignMatch {
  campaignId: string;
  score: number;
  evidence: string[];
}

interface CorrelationMatch {
  campaignIds: string[];
  campaignRelationship: string;
  matchedBrands: string[];
  matches?: CampaignMatch[];
}

const normalize = (value: string) => value.toLowerCase().trim();

const overlap = (a: string[] = [], b: string[] = []) => {
  const setB = new Set(b.map(normalize));
  return a.filter((x) => setB.has(normalize(x)));
};

export function correlateWithCampaigns(
  signals: ObservedSignals,
  analysis: GeminiAnalysisResult,
  dna: CompactWebsiteDNA
): CorrelationMatch {
  const campaigns = demoData.campaigns || [];
  const incidents = demoData.incidents || [];

  const host = normalize(signals.hostname);
  const claimedBrand = normalize(analysis.claimedOrganization);
  const pageText = normalize(signals.visibleTextSnippet);
  // Development-only synthetic correlation fixture.
// This creates a deterministic positive match without contacting
// any real suspicious infrastructure.
const isSyntheticC17Test =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' &&
  host === 'uniswap-demo.invalid';

if (isSyntheticC17Test) {
  return {
    campaignIds: ['camp-c17'],
    campaignRelationship:
      'Strong synthetic correlation with C-17 (Crypto Wallet Drainer Infrastructure) — 90/100 correlation score.',
    matchedBrands: ['Uniswap'],
    matches: [
      {
        campaignId: 'camp-c17',
        score: 90,
        evidence: [
          'Synthetic fixture explicitly targets Uniswap.',
          'Synthetic fixture is linked to campaign C-17 for deterministic testing.',
          'Campaign C-17 targets Uniswap as a known impersonation brand.',
          'Synthetic test vector: sponsored_search.',
        ],
      },
    ],
  };
}
  

  const matches: CampaignMatch[] = [];
  const matchedBrands = new Set<string>();

  for (const campaign of campaigns) {
    let score = 0;
    const evidence: string[] = [];

    // ---------------------------------------------------------
    // 1. Brand relationship
    // ---------------------------------------------------------
    const brandMatches = campaign.targetedBrands.filter((brand) => {
      const b = normalize(brand);
      return (
        claimedBrand.includes(b) ||
        host.includes(b.replace(/\s+/g, '')) ||
        pageText.includes(b)
      );
    });

    if (brandMatches.length > 0) {
      score += 15;
      brandMatches.forEach((b) => matchedBrands.add(b));
      evidence.push(
        `Targeted-brand relationship: ${brandMatches.join(', ')}`
      );
    }

    // ---------------------------------------------------------
    // 2. Exact / near hostname relationship
    // ---------------------------------------------------------
    const relatedIncident = incidents.find((incident) => {
      const domain = normalize(incident.normalizedDomain);
      return domain === host;
    });

    if (relatedIncident) {
      score += 35;
      evidence.push('Exact domain match with a previously reported incident.');
    }

    // ---------------------------------------------------------
    // 3. Structural fingerprint
    // ---------------------------------------------------------
    if (dna.structuralHash) {
      const structuralMatch = incidents.some(
        (incident) =>
          incident.campaignId === campaign.id &&
          incident.dna?.structuralHash === dna.structuralHash
      );

      if (structuralMatch) {
        score += 30;
        evidence.push(
          'Matching structural fingerprint found in campaign incidents.'
        );
      }
    }

    // ---------------------------------------------------------
    // 4. Phishing-kit fingerprint
    // ---------------------------------------------------------
    if (dna.kitSignature && campaign.kitFingerprint) {
      if (
        normalize(dna.kitSignature) ===
        normalize(campaign.kitFingerprint)
      ) {
        score += 35;
        evidence.push(
          `Matching kit fingerprint: ${campaign.kitFingerprint}`
        );
      }
    }

    // ---------------------------------------------------------
    // 5. External infrastructure
    // ---------------------------------------------------------
    const campaignIncidents = incidents.filter(
      (incident) => incident.campaignId === campaign.id
    );

    const campaignDomains = campaignIncidents.flatMap((incident) => [
      ...(incident.dna?.nameservers || []),
      incident.dna?.autonomousSystem || '',
      ...(incident.dna?.c2Endpoints || []),
    ]);

    const observedInfrastructure = [
      ...(dna.externalDomains || []),
      ...(signals.externalDomains || []),
    ];

    const infrastructureMatches = overlap(
      observedInfrastructure,
      campaignDomains
    );

    if (infrastructureMatches.length > 0) {
      score += Math.min(25, infrastructureMatches.length * 10);
      evidence.push(
        `Shared infrastructure indicators: ${infrastructureMatches.join(', ')}`
      );
    }

    // ---------------------------------------------------------
    // 6. Redirect relationship
    // ---------------------------------------------------------
    if (signals.redirectCount > 0) {
      const redirectTerms = signals.redirectChain.map((url) => {
        try {
          return new URL(url).hostname;
        } catch {
          return '';
        }
      });

      const redirectMatch = campaignIncidents.some((incident) =>
        redirectTerms.some(
          (domain) =>
            domain &&
            (
              incident.dna?.c2Endpoints || []
            ).some((endpoint) =>
              normalize(endpoint).includes(normalize(domain))
            )
        )
      );

      if (redirectMatch) {
        score += 20;
        evidence.push('Redirect infrastructure overlaps with campaign activity.');
      }
    }

    // ---------------------------------------------------------
    // 7. Visual/theme relationship
    // ---------------------------------------------------------
    if (dna.visualTheme) {
      const themeMatch = campaignIncidents.some(
        (incident) =>
          incident.dna?.visualTheme &&
          normalize(incident.dna.visualTheme) === normalize(dna.visualTheme!)
      );

      if (themeMatch) {
        score += 15;
        evidence.push('Matching visual/page theme found in campaign incidents.');
      }
    }

    // ---------------------------------------------------------
    // 8. Vector/context relationship
    // ---------------------------------------------------------
    const vector = (signals as ObservedSignals & { victimVector?: string })
      .victimVector;

    if (vector && normalize(vector) === normalize(campaign.primaryVector)) {
      score += 5;
      evidence.push(`Matching delivery vector: ${campaign.primaryVector}`);
    }

    // ---------------------------------------------------------
    // Cap and store meaningful matches only
    // ---------------------------------------------------------
    score = Math.min(100, score);

    if (score >= 45) {
      matches.push({
        campaignId: campaign.id,
        score,
        evidence,
      });
    }
  }

  matches.sort((a, b) => b.score - a.score);

  const topMatches = matches.slice(0, 3);
  const campaignIds = topMatches.map((m) => m.campaignId);

  let campaignRelationship =
    'No sufficiently strong relationship with known campaign clusters.';

  if (topMatches.length > 0) {
    const best = topMatches[0];
    const campaign = campaigns.find((c) => c.id === best.campaignId);

    if (campaign) {
      const confidenceLabel =
        best.score >= 80
          ? 'Strong'
          : best.score >= 60
            ? 'Moderate'
            : 'Weak';

      campaignRelationship =
        `${confidenceLabel} potential relationship with ${campaign.code} (${campaign.name}) — ` +
        `${best.score}/100 correlation score. ` +
        `${best.evidence.slice(0, 4).join(' ')}`;
    }
  }

  return {
    campaignIds,
    campaignRelationship,
    matchedBrands: Array.from(matchedBrands),
    matches: topMatches,
  };
}