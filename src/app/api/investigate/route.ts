import { NextRequest, NextResponse } from 'next/server';
import { validateAndNormalizeUrl } from '@/lib/scanner/safe-fetch';
import { runUrlInvestigation } from '@/lib/scanner/url-investigation';

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

    // 2. Run complete 7-step URL Investigation Pipeline
    const record = await runUrlInvestigation(url, userContext);

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
