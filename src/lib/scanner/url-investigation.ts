import { validateAndNormalizeUrl, collectObservableSignals } from '@/lib/scanner/safe-fetch';
import { checkGoogleSafeBrowsing } from '@/lib/scanner/safe-browsing';
import { analyzeWithGemini } from '@/lib/scanner/gemini-analyzer';
import { generateWebsiteDNA } from '@/lib/scanner/website-dna';
import { correlateWithCampaigns } from '@/lib/scanner/correlator';
import { saveInvestigation } from '@/lib/data/investigation-store';
import { InvestigationRecord } from '@/types';

/**
 * Executes the complete 7-step URL Investigation Pipeline:
 * 1. URL validation & SSRF protection
 * 2. Passive observable technical signal collection (DNS, TLS, headers, DOM text)
 * 3. External reputation intelligence (Google Safe Browsing v4 when configured)
 * 4. Gemini AI multimodal threat synthesis & identity consistency evaluation
 * 5. Deterministic Website DNA extraction (structural DOM, kit signatures, brand claims)
 * 6. Cross-incident & campaign graph correlation (matches against observed clusters like C-17)
 * 7. Storage persistence (Firestore with resilient in-memory fallback)
 */
export async function runUrlInvestigation(
  targetUrl: string,
  userContext?: string
): Promise<InvestigationRecord> {
  // 1. Validate & Normalize URL (reject non-http/https, SSRF IPs)
  const validation = validateAndNormalizeUrl(targetUrl);
  if (!validation.valid || !validation.normalizedUrl) {
    throw new Error(validation.error || 'Invalid or disallowed URL supplied.');
  }

  const normalizedUrl = validation.normalizedUrl;

  // 2. Collect Observable Technical Signals (safe read-only fetch)
  const observedSignals = await collectObservableSignals(normalizedUrl);

  // 3. Google Safe Browsing Intelligence Check
  const threatIntelligence = await checkGoogleSafeBrowsing(normalizedUrl);

  // 4. Gemini AI Threat Synthesis & Analysis
  const geminiAnalysis = await analyzeWithGemini(observedSignals, userContext);

  // 5. Build Compact Deterministic Website DNA
  const websiteDNA = generateWebsiteDNA(observedSignals, geminiAnalysis);

  // 6. Cross-Incident & Campaign Correlation
  const correlation = correlateWithCampaigns(observedSignals, geminiAnalysis, websiteDNA);

  // 7. Assemble Complete Investigation Record
  const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  const record: InvestigationRecord = {
    id,
    createdAt,
    url: targetUrl,
    normalizedUrl,
    contextText: userContext,
    classification: geminiAnalysis.classification,
    confidence: geminiAnalysis.confidence,
    observedSignals,
    threatIntelligence,
    geminiAnalysis,
    websiteDNA,
    campaignIds: correlation.campaignIds,
    campaignRelationship: correlation.campaignRelationship,
    campaignMatches: correlation.matches,
    recommendations: geminiAnalysis.recommendedActions,
    storageSource: 'local_fallback',
  };

  // 8. Store in Firestore with resilient fallback
  const saveResult = await saveInvestigation(record);
  record.storageSource = saveResult.storageSource;

  return record;
}
