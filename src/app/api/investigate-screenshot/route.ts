import { NextRequest, NextResponse } from 'next/server';
import { analyzeScreenshotMessage } from '@/lib/scanner/screenshot-analyzer';
import { validateAndNormalizeUrl, collectObservableSignals } from '@/lib/scanner/safe-fetch';
import { checkGoogleSafeBrowsing } from '@/lib/scanner/safe-browsing';
import { analyzeWithGemini } from '@/lib/scanner/gemini-analyzer';
import { generateWebsiteDNA } from '@/lib/scanner/website-dna';
import { correlateWithCampaigns } from '@/lib/scanner/correlator';
import { saveInvestigation } from '@/lib/data/investigation-store';
import { InvestigationRecord, MessageInvestigationRecord } from '@/types';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB (keeps within Vercel's 4.5 MB body limit)

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image');
    const userContext = formData.get('context')?.toString() || undefined;
    const shouldCorrelate = formData.get('correlateUrl') === 'true';

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'A screenshot image file is required.' },
        { status: 400 }
      );
    }

    // 1. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(imageFile.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type (${imageFile.type}). Supported formats: PNG, JPG, JPEG, WEBP.`,
        },
        { status: 400 }
      );
    }

    // 2. Validate file size (max 3 MB)
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Image file is too large (${(imageFile.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 3 MB.`,
        },
        { status: 400 }
      );
    }

    // 3. Convert to base64 in memory only — never stored permanently
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    // 4. Gemini Multimodal Vision Analysis (Memory-only)
    const messageAnalysis = await analyzeScreenshotMessage(
      base64Data,
      imageFile.type,
      userContext
    );

    // 5. Downstream URL correlation: Only performed if explicitly requested and URLs were extracted.
    let urlInvestigation: InvestigationRecord | undefined = undefined;

    if (shouldCorrelate && messageAnalysis.extractedUrls && messageAnalysis.extractedUrls.length > 0) {
      const candidateUrl = messageAnalysis.extractedUrls[0];
      const validation = validateAndNormalizeUrl(candidateUrl);

      if (validation.valid && validation.normalizedUrl) {
        try {
          const normalizedUrl = validation.normalizedUrl;
          const observedSignals = await collectObservableSignals(normalizedUrl);
          const threatIntelligence = await checkGoogleSafeBrowsing(normalizedUrl);
          const geminiAnalysis = await analyzeWithGemini(observedSignals, userContext);
          const websiteDNA = generateWebsiteDNA(observedSignals, geminiAnalysis);
          const correlation = correlateWithCampaigns(observedSignals, geminiAnalysis, websiteDNA);

          const urlRecordId = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const urlRecord: InvestigationRecord = {
            id: urlRecordId,
            createdAt: new Date().toISOString(),
            url: candidateUrl,
            normalizedUrl,
            contextText: 'Extracted from screenshot message analysis',
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
            `[investigate-screenshot] URL sub-investigation notice: ${urlErr instanceof Error ? urlErr.message : String(urlErr)}`
          );
        }
      }
    }

    // 6. Return standard MessageInvestigationRecord
    const record: MessageInvestigationRecord = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      classification: messageAnalysis.classification,
      confidence: messageAnalysis.confidence,
      investigationType: 'screenshot',
      messageAnalysis,
      extractedUrls: messageAnalysis.extractedUrls,
      urlInvestigation,
    };

    return NextResponse.json({
      success: true,
      data: record,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API /api/investigate-screenshot Error]:', message);

    return NextResponse.json(
      {
        success: false,
        error: `Screenshot investigation failed: ${message}`,
      },
      { status: 500 }
    );
  }
}
