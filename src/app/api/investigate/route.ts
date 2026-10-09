import { NextRequest, NextResponse } from 'next/server';
import { validateAndNormalizeUrl, collectObservableSignals } from '@/lib/scanner/safe-fetch';
import { checkGoogleSafeBrowsing } from '@/lib/scanner/safe-browsing';
import { analyzeWithGemini } from '@/lib/scanner/gemini-analyzer';
import { generateWebsiteDNA } from '@/lib/scanner/website-dna';
import { correlateWithCampaigns } from '@/lib/scanner/correlator';
import { saveInvestigation } from '@/lib/data/investigation-store';
import { InvestigationRecord } from '@/types';

export async function POST(req: NextRequest) {
  try {
    let body: { url?: unknown; context?: unknown } | null = null;
    try {
      body = (await req.json()) as { url?: unknown; context?: unknown };
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const rawUrl = body?.url;
    const userContext =
      typeof body?.context === 'string' && body.context.trim() ? body.context.trim() : undefined;

    if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
      return NextResponse.json(
        { success: false, error: 'A website URL is required.' },
        { status: 400 }
      );
    }

    const url = rawUrl.trim();

    // 1. Validate & Normalize URL (reject non-http/https, SSRF IPs)
    const validation = validateAndNormalizeUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || 'Invalid URL supplied.' },
        { status: 400 }
      );
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
      url,
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

    // 8. Store in Firestore (/investigations) with resilient fallback
    const saveResult = await saveInvestigation(record);
    record.storageSource = saveResult.storageSource;

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API /api/investigate Error]:', error);

    return NextResponse.json(
      {
        success: false,
        error: `Investigation engine encountered an internal error: ${message}`,
      },
      { status: 500 }
    );
  }
}
