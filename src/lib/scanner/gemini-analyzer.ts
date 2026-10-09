import { GeminiAnalysisResult, ObservedSignals, ThreatClassification } from '@/types';

/**
 * Analyzes observed technical evidence using Google Gemini API.
 * Returns structured findings strictly grounded in the provided signals.
 */
export async function analyzeWithGemini(
  signals: ObservedSignals,
  userContext?: string
): Promise<GeminiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.7-flash';

  // Server-side diagnostic — never logs the key value, only its presence/length
  console.log(`[Gemini] API key present: ${!!apiKey && apiKey !== 'your_gemini_api_key_here'} | key length: ${apiKey ? apiKey.trim().length : 0} | model: ${model}`);

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    console.warn('[Gemini] Falling back to heuristic: GEMINI_API_KEY not set or is still the placeholder value.');
    return generateHeuristicFallback(signals, userContext, 'GEMINI_API_KEY not configured in environment');
  }

  const systemInstruction = `You are a defensive AI cybersecurity analyst for SCAMCHAIN.
Your task is to analyze ONLY the provided technical evidence for a website and determine if it shows indicators of phishing, credential harvesting, brand impersonation, or scam infrastructure.

CRITICAL CONSTRAINTS:
1. Do NOT invent technical facts, domains, IP addresses, or vulnerabilities not present in the supplied evidence.
2. Ground all suspicious and benign signals directly in the provided evidence.
3. Classify into exactly one of: "LEGITIMATE", "SUSPICIOUS", "HIGH_RISK", "UNKNOWN".
   - HIGH_RISK: Clear signs of credential harvesting, brand impersonation, crypto drainers, or malicious deceptive intent.
   - SUSPICIOUS: Deceptive naming, mismatched identity, missing critical security controls with ambiguous context.
   - LEGITIMATE: Verified authentic brand domain, consistent identity, benign purpose, proper security hygiene.
   - UNKNOWN: Site unreachable, insufficient textual signals, or completely generic park page.
4. Output MUST be valid raw JSON matching the required schema. No markdown formatting outside the JSON.`;

  const evidencePayload = {
    targetUrl: signals.normalizedUrl,
    hostname: signals.hostname,
    finalUrl: signals.finalUrl,
    redirects: signals.redirectCount,
    httpStatus: signals.httpStatus,
    statusText: signals.statusText,
    pageTitle: signals.pageTitle,
    securityHeaders: signals.securityHeaders,
    tls: signals.tlsMetadata,
    externalDomainsFound: signals.externalDomains.slice(0, 15),
    visiblePageTextSnippet: signals.visibleTextSnippet.slice(0, 1500),
    userSubmittedContext: userContext || 'None provided',
    rawFetchError: signals.rawFetchError || 'None',
  };

  const promptText = `${systemInstruction}

OBSERVED TECHNICAL EVIDENCE:
${JSON.stringify(evidencePayload, null, 2)}

Respond with a JSON object with this exact structure:
{
  "claimedOrganization": string,
  "sitePurpose": string,
  "suspiciousSignals": string[],
  "benignSignals": string[],
  "identityConsistency": "Consistent" | "Inconsistent" | "Suspicious" | "Unknown",
  "potentialPhishingIndicators": string[],
  "possibleCampaignCharacteristics": string[],
  "classification": "LEGITIMATE" | "SUSPICIOUS" | "HIGH_RISK" | "UNKNOWN",
  "confidence": number between 0 and 100,
  "explanation": string,
  "recommendedActions": string[]
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
        // NOTE: Do NOT use responseMimeType: 'application/json' for security analysis.
        // When Gemini's safety filters trigger on phishing/scam content, the model
        // returns an empty parts array — which causes "model output must contain either
        // output text or tool calls" errors. Plain text output with JSON in the prompt
        // is more resilient; we parse the JSON out of the text response ourselves.
        generationConfig: {
          temperature: 0.1,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`Gemini API error (HTTP ${res.status}): ${errText}`);
      return generateHeuristicFallback(
        signals,
        userContext,
        `Gemini API returned status ${res.status}`
      );
    }

    const data = await res.json();

    // Check for prompt-level blocks before accessing candidates
    if (data.promptFeedback?.blockReason) {
      console.warn(`Gemini prompt blocked: ${data.promptFeedback.blockReason}`);
      return generateHeuristicFallback(
        signals,
        userContext,
        `Gemini prompt blocked (${data.promptFeedback.blockReason})`
      );
    }

    const candidate = data.candidates?.[0];

    // Check finish reason — SAFETY / OTHER / RECITATION all produce empty parts
    if (candidate?.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
      console.warn(`Gemini candidate blocked with finishReason: ${candidate.finishReason}`);
      return generateHeuristicFallback(
        signals,
        userContext,
        `Gemini output filtered (finishReason: ${candidate.finishReason})`
      );
    }

    const candidateText = candidate?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return generateHeuristicFallback(signals, userContext, 'Gemini returned empty candidate text');
    }

    // Extract JSON — handles raw JSON, markdown-fenced JSON, or JSON embedded in prose
    const jsonMatch = candidateText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      candidateText.match(/```\s*([\s\S]*?)\s*```/);
    const cleanedJson = jsonMatch ? jsonMatch[1].trim() : candidateText.trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (parseErr) {
      // Log first 200 chars of the raw text so we can diagnose unexpected model output
      console.warn(`[Gemini] JSON parse failed. Raw response (first 200 chars): ${candidateText.slice(0, 200)}`);
      console.warn(`[Gemini] Parse error: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      return generateHeuristicFallback(signals, userContext, 'Gemini response was not valid JSON');
    }

    // Validate and sanitize schema
    const validClassifications: ThreatClassification[] = ['LEGITIMATE', 'SUSPICIOUS', 'HIGH_RISK', 'UNKNOWN'];
    const classification: ThreatClassification = validClassifications.includes(parsed.classification as ThreatClassification)
      ? (parsed.classification as ThreatClassification)
      : 'UNKNOWN';

    const confidence = typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 70;

    console.log(`[Gemini] Analysis complete — classification: ${classification}, confidence: ${confidence}, model: ${model}`);

    return {
      claimedOrganization: (parsed.claimedOrganization as string) || 'Unknown / Not Stated',
      sitePurpose: (parsed.sitePurpose as string) || 'General Web Resource',
      suspiciousSignals: Array.isArray(parsed.suspiciousSignals) ? (parsed.suspiciousSignals as string[]) : [],
      benignSignals: Array.isArray(parsed.benignSignals) ? (parsed.benignSignals as string[]) : [],
      identityConsistency: ['Consistent', 'Inconsistent', 'Suspicious', 'Unknown'].includes(parsed.identityConsistency as string)
        ? (parsed.identityConsistency as 'Consistent' | 'Inconsistent' | 'Suspicious' | 'Unknown')
        : 'Unknown',
      potentialPhishingIndicators: Array.isArray(parsed.potentialPhishingIndicators)
        ? (parsed.potentialPhishingIndicators as string[])
        : [],
      possibleCampaignCharacteristics: Array.isArray(parsed.possibleCampaignCharacteristics)
        ? (parsed.possibleCampaignCharacteristics as string[])
        : [],
      classification,
      confidence,
      explanation: (parsed.explanation as string) || 'Analysis derived from observed structural and identity evidence.',
      recommendedActions: Array.isArray(parsed.recommendedActions) && (parsed.recommendedActions as unknown[]).length > 0
        ? (parsed.recommendedActions as string[])
        : ['Exercise standard caution when interacting with untrusted domains.'],
      modelUsed: model,
      fallbackUsed: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Gemini] Request failed with exception: ${message}`);
    return generateHeuristicFallback(signals, userContext, `Gemini request exception: ${message}`);
  }
}

/**
 * Deterministic evidence-based heuristic fallback if Gemini API is offline or unconfigured.
 * Grounded 100% on observed facts without hallucination.
 */
function generateHeuristicFallback(
  signals: ObservedSignals,
  userContext?: string,
  fallbackReason?: string
): GeminiAnalysisResult {
  const host = signals.hostname.toLowerCase();
  const text = signals.visibleTextSnippet.toLowerCase();
  const suspiciousSignals: string[] = [];
  const benignSignals: string[] = [];
  const phishingIndicators: string[] = [];
  const campaignCharacteristics: string[] = [];
  const recommendedActions: string[] = [];

  // Check if site is unreachable
  if (signals.httpStatus === 'Unreachable') {
    return {
      claimedOrganization: 'Unreachable Host',
      sitePurpose: 'Domain is currently inactive, non-responsive, or blocked at DNS level.',
      suspiciousSignals: ['Domain failed DNS resolution or network connection timed out.'],
      benignSignals: [],
      identityConsistency: 'Unknown',
      potentialPhishingIndicators: ['Inaccessible or fast-flux infrastructure'],
      possibleCampaignCharacteristics: ['Domain may be dormant, taken down, or geo-gated.'],
      classification: 'UNKNOWN',
      confidence: 45,
      explanation: `Site could not be reached (${signals.statusText}). Unable to collect live page signals. Evaluated via defensive fallback (${fallbackReason || 'standard evaluation'}).`,
      recommendedActions: [
        'Do not trust communications pointing to this domain.',
        'Monitor DNS records for reactivation or redirect changes.',
      ],
      modelUsed: 'Heuristic Rule Evaluator (Standby)',
      fallbackUsed: true,
    };
  }

  // Common high-profile benign domains
  const knownLegitDomains = [
    'google.com',
    'microsoft.com',
    'apple.com',
    'wikipedia.org',
    'github.com',
    'cloudflare.com',
    'amazon.com',
    'example.com',
  ];

  const isKnownLegit = knownLegitDomains.some((d) => host === d || host.endsWith(`.${d}`));

  // Check security headers
  if (signals.securityHeaders.strictTransportSecurity !== 'Not Enforced') {
    benignSignals.push('Strict-Transport-Security (HSTS) is actively enforced.');
  } else {
    suspiciousSignals.push('HSTS security header is missing.');
  }

  if (signals.securityHeaders.contentSecurityPolicy !== 'Not Enforced') {
    benignSignals.push('Content-Security-Policy (CSP) is configured.');
  }

  if (signals.tlsMetadata.isSecure) {
    benignSignals.push('Valid HTTPS connection established.');
  } else {
    suspiciousSignals.push('Insecure plain HTTP protocol in use.');
    phishingIndicators.push('Lack of SSL/TLS encryption.');
  }

  // Deceptive naming heuristics
  const suspiciousKeywords = [
    'login',
    'verify',
    'security',
    'auth',
    'update',
    'claim',
    'airdrop',
    'wallet',
    'support',
    'reauth',
    'drainer',
  ];

  const foundKeywords = suspiciousKeywords.filter((k) => host.includes(k));
  if (foundKeywords.length > 0) {
    suspiciousSignals.push(`Hostname contains high-risk authentication keyword(s): "${foundKeywords.join(', ')}".`);
    phishingIndicators.push('Domain spoofing / lookalike keyword syntax');
  }

  // Phishing lure keywords in text
  const credentialPhrases = ['seed phrase', 'private key', 'secret recovery phrase', 'confirm password', 'social security'];
  const foundPhrases = credentialPhrases.filter((p) => text.includes(p));
  if (foundPhrases.length > 0) {
    suspiciousSignals.push(`Visible page text requests sensitive credentials: "${foundPhrases.join(', ')}".`);
    phishingIndicators.push('Direct credential extraction prompts');
  }

  // External domains check
  if (signals.externalDomains.length > 10) {
    campaignCharacteristics.push(`References ${signals.externalDomains.length} external third-party domains.`);
  }

  // Determine classification
  let classification: ThreatClassification = 'UNKNOWN';
  let confidence = 65;
  let identityConsistency: 'Consistent' | 'Inconsistent' | 'Suspicious' | 'Unknown' = 'Unknown';

  if (isKnownLegit) {
    classification = 'LEGITIMATE';
    confidence = 92;
    identityConsistency = 'Consistent';
    benignSignals.push(`Domain "${host}" belongs to established organization infrastructure.`);
    recommendedActions.push('No hostile indicators observed for verified organization domain.');
  } else if (foundKeywords.length >= 2 || foundPhrases.length > 0) {
    classification = 'HIGH_RISK';
    confidence = 88;
    identityConsistency = 'Suspicious';
    recommendedActions.push('Do NOT submit credentials, private keys, or personal information.');
    recommendedActions.push('Block domain at DNS/firewall gateway and flag related phishing lures.');
  } else if (foundKeywords.length === 1 || suspiciousSignals.length > 2) {
    classification = 'SUSPICIOUS';
    confidence = 72;
    identityConsistency = 'Inconsistent';
    recommendedActions.push('Verify legitimacy through official authenticated channels before navigating.');
    recommendedActions.push('Inspect domain registration age and SSL certificate issuer.');
  } else {
    classification = 'UNKNOWN';
    confidence = 50;
    identityConsistency = 'Unknown';
    recommendedActions.push('Proceed with caution; insufficient indicators to confirm reputation.');
  }

  return {
    claimedOrganization: signals.pageTitle !== 'Unavailable' ? signals.pageTitle.slice(0, 60) : host,
    sitePurpose: 'Web portal or resource extracted from observable content.',
    suspiciousSignals,
    benignSignals,
    identityConsistency,
    potentialPhishingIndicators: phishingIndicators,
    possibleCampaignCharacteristics: campaignCharacteristics,
    classification,
    confidence,
    explanation: `Evidence-based heuristic analysis on observed technical signals (${fallbackReason || 'deterministic evaluation'}). Identified ${suspiciousSignals.length} suspicious and ${benignSignals.length} benign markers.`,
    recommendedActions,
    modelUsed: 'Heuristic Defense Engine',
    fallbackUsed: true,
  };
}
