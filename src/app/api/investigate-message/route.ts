import { NextRequest, NextResponse } from 'next/server';
import { analyzeTextMessage } from '@/lib/scanner/message-analyzer';
import { validateAndNormalizeUrl, collectObservableSignals } from '@/lib/scanner/safe-fetch';
import { checkGoogleSafeBrowsing } from '@/lib/scanner/safe-browsing';
import { analyzeWithGemini } from '@/lib/scanner/gemini-analyzer';
import { generateWebsiteDNA } from '@/lib/scanner/website-dna';
import { correlateWithCampaigns } from '@/lib/scanner/correlator';
import { saveInvestigation } from '@/lib/data/investigation-store';
import { InvestigationRecord, MessageInvestigationRecord } from '@/types';

const MAX_MESSAGE_LENGTH = 5000;

export async function POST(req: NextRequest) {
  try {
    let body: { message?: unknown; context?: unknown; correlateUrl?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { message, context, correlateUrl } = body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter or paste a message to analyze.' },
        { status: 400 }
      );
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Message exceeds maximum allowed length of ${MAX_MESSAGE_LENGTH} characters (current length: ${message.length}).`,
        },
        { status: 400 }
      );
    }

    const userContext = typeof context === 'string' && context.trim() ? context.trim() : undefined;
    const shouldCorrelate = Boolean(correlateUrl);
    return await processTextMessage(message, userContext, shouldCorrelate);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API /api/investigate-message Error]:', message);

    return NextResponse.json(
      {
        success: false,
        error: `Message investigation failed: ${message}`,
      },
      { status: 500 }
    );
  }
}

async function processTextMessage(message: string, context?: string, shouldCorrelate: boolean = false) {
  // 1. Dedicated text-based message analysis (Gemini + Indian-language support + heuristic fallback)
  // Does NOT automatically fetch websites or duplicate Gemini calls for message investigations.
  const messageAnalysis = await analyzeTextMessage(message, context);

  // 2. Downstream URL correlation: Only performed if explicitly requested and URLs were extracted.
  let urlInvestigation: InvestigationRecord | undefined = undefined;

  if (shouldCorrelate && messageAnalysis.extractedUrls && messageAnalysis.extractedUrls.length > 0) {
    const candidateUrl = messageAnalysis.extractedUrls[0];
    const validation = validateAndNormalizeUrl(candidateUrl);

    if (validation.valid && validation.normalizedUrl) {
      try {
        const normalizedUrl = validation.normalizedUrl;
        const observedSignals = await collectObservableSignals(normalizedUrl);
        const threatIntelligence = await checkGoogleSafeBrowsing(normalizedUrl);
        const geminiAnalysis = await analyzeWithGemini(observedSignals, context);
        const websiteDNA = generateWebsiteDNA(observedSignals, geminiAnalysis);
        const correlation = correlateWithCampaigns(observedSignals, geminiAnalysis, websiteDNA);

        const urlRecordId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const urlRecord: InvestigationRecord = {
          id: urlRecordId,
          createdAt: new Date().toISOString(),
          url: candidateUrl,
          normalizedUrl,
          contextText: 'Extracted from suspicious message text analysis',
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

        const saveResult = await saveInvestigation(urlRecord);
        urlRecord.storageSource = saveResult.storageSource;
        urlInvestigation = urlRecord;
      } catch (urlErr) {
        console.warn(
          `[investigate-message] URL sub-investigation notice: ${urlErr instanceof Error ? urlErr.message : String(urlErr)}`
        );
      }
    }
  }

  // 3. Assemble validated MessageInvestigationRecord
  const record: MessageInvestigationRecord = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    classification: messageAnalysis.classification,
    confidence: messageAnalysis.confidence,
    investigationType: 'message',
    messageAnalysis,
    extractedUrls: messageAnalysis.extractedUrls,
    urlInvestigation,
  };

  return NextResponse.json({
    success: true,
    data: record,
  });
}
