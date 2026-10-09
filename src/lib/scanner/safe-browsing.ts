import { ThreatIntelligenceResult } from '@/types';

/**
 * Queries Google Safe Browsing Lookup API v4 for the target URL.
 * Fails gracefully if no key is configured or network fails.
 */
export async function checkGoogleSafeBrowsing(targetUrl: string): Promise<ThreatIntelligenceResult> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  const now = new Date().toISOString();

  if (!apiKey || apiKey === 'your_google_safe_browsing_key_here' || apiKey.trim() === '') {
    return {
      provider: 'Google Safe Browsing v4',
      status: 'Unavailable',
      listed: false,
      threatTypes: [],
      details: 'Google Safe Browsing API key not configured in environment variables.',
      queriedAt: now,
    };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`;

  const requestPayload = {
    client: {
      clientId: 'scamchain-threat-intelligence',
      clientVersion: '2.0.0',
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [{ url: targetUrl }],
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      return {
        provider: 'Google Safe Browsing v4',
        status: 'Unavailable',
        listed: false,
        threatTypes: [],
        details: `Service returned HTTP ${res.status}: ${errText.slice(0, 150)}`,
        queriedAt: now,
      };
    }

    const data = await res.json();
    const matches = data.matches || [];

    if (matches.length > 0) {
      const threatTypes = Array.from(new Set(matches.map((m: { threatType: string }) => m.threatType))) as string[];
      return {
        provider: 'Google Safe Browsing v4',
        status: 'Listed',
        listed: true,
        threatTypes,
        details: `Flagged in Google Safe Browsing intelligence database: ${threatTypes.join(', ')}`,
        queriedAt: now,
      };
    }

    return {
      provider: 'Google Safe Browsing v4',
      status: 'Clean (Not Listed)',
      listed: false,
      threatTypes: [],
      details:
        'No known listing found in Google Safe Browsing threat databases. (Note: zero-day attacks or newly registered lookalike domains may not yet be indexed).',
      queriedAt: now,
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    return {
      provider: 'Google Safe Browsing v4',
      status: 'Unavailable',
      listed: false,
      threatTypes: [],
      details: `Intelligence lookup request failed: ${message}`,
      queriedAt: now,
    };
  }
}
