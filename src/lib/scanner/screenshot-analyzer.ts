import { MessageInvestigationResult, MessageThreatClassification } from '@/types';
import { detectLanguageFromText, extractUrlsFromText } from './message-analyzer';

/**
 * Analyzes a screenshot of a suspicious message using Google Gemini multimodal capabilities.
 * Strictly adheres to defensive guidelines:
 * - Differentiates real scams/social engineering from humor/parody.
 * - Detects requests for money/crypto, impersonation, urgent threats, fake prizes, account warnings.
 * - Extracts visible URLs for optional downstream URL pipeline correlation.
 * - Memory-only processing, never persists uploaded image buffers.
 */
export async function analyzeScreenshotMessage(
  imageBase64: string,
  mimeType: string,
  userContext?: string
): Promise<MessageInvestigationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return generateMessageHeuristicFallback(
      userContext,
      'GEMINI_API_KEY not configured in environment'
    );
  }

  const promptText = `You are a defensive AI cybersecurity and scam detection analyst for SCAMCHAIN.
Your task is to analyze the provided screenshot of a message (e.g. from SMS, WhatsApp, Telegram, Instagram, email, social media, or any messaging app).

ANALYZE BOTH VISUAL CONTEXT AND VISIBLE TEXT TO DETERMINE:
1. Classification: Exactly one of "SCAM", "SUSPICIOUS", "LEGITIMATE", "UNKNOWN".
   - SCAM: Clear malicious intent (e.g., credential theft, fake delivery fee phishing, fake tech support, wallet drainers, urgent wire/crypto demand, fake account closure threat with suspicious links).
   - SUSPICIOUS: Deceptive characteristics, implausible identity claims, money requests without official verification, or requests to move platforms.
   - LEGITIMATE: Ordinary human or authentic service communications without deceptive pressure or fraudulent requests.
   - UNKNOWN: Image unreadable, completely blank, or insufficient context.
2. Confidence: Number between 0 and 100.
3. Extracted Text: Full verbatim transcript of all readable messages/text in the image.
4. Extracted URLs: Any web domains or URLs visible in the message (e.g. "bit.ly/...", "example.com", "http://..."). Return empty array [] if none.
5. Findings: List of human-understandable reasons for the classification (e.g. "The sender makes an unusual identity claim", "The message asks for money").
6. Risk Factors: Specific technical/social-engineering tactics observed (e.g., "Impersonation", "Urgency pressure", "Credential solicitation").
7. Possible Humor Or Joke: boolean — true if the message is clearly satirical, playful banter, a meme, or a joke, even if it mentions money or strange claims like "i am michael jackson send money".
8. Impersonation Detected: boolean — true if the sender claims to be a celebrity, official body, bank, government agency, or other trusted entity they are unlikely to be.
9. Identity Theft Risk: Exactly one of "LOW", "MEDIUM", "HIGH", "UNKNOWN" — reflecting the likelihood this message could lead to identity theft or account compromise.
10. Sensitive Information Requested: Array of strings listing any sensitive data types solicited (e.g. "OTP", "Password", "Credit card number", "Social Security Number", "Bank account details"). Return [] if none.
11. Identity Risk Findings: Array of human-readable strings explaining any identity theft or impersonation concerns found (e.g. "Sender claims to be IRS but uses an informal messaging platform", "Message requests OTP code"). Return [] if no concerns.
12. Detected Language: Specific language or combination (e.g. "English", "Hindi", "Hinglish", "Kannada", "Tamil", "Telugu", "Mixed", or "Unknown").
13. Explanation In Detected Language: If detected language is Hindi, Hinglish, Kannada, Tamil, or Telugu, provide a 1-sentence warning in that language. Otherwise null.
14. Explanation: 2-3 sentence clear summary explaining what is happening and the risk level. If it appears to be a joke, explicitly note: "Likely a joke or playful message, but the request itself is financially risky. Do not send money."
15. Recommended Action: Clear safe advice for the user.

CRITICAL RULES:
- Ground all findings strictly in the provided visual message.
- Support Indian languages (Hindi, Hinglish, Kannada, Tamil, Telugu, English).
- Do NOT flag a message as suspicious solely due to informal language, slang, typos, emojis, or unusual phrasing. Look for actual scam indicators (money, credentials, OTPs, impersonation, deceptive links, coercive urgency).
- Distinguish between obvious jokes/memes and authentic fraud. If it is a joke, set possibleHumorOrJoke: true and explain responsibly without asserting real fraud.
- Output MUST be valid raw JSON. No markdown backticks outside the JSON.

Expected JSON format:
{
  "classification": "SCAM" | "SUSPICIOUS" | "LEGITIMATE" | "UNKNOWN",
  "confidence": 0,
  "extractedText": "",
  "detectedLanguage": "English",
  "explanationInDetectedLanguage": null,
  "extractedUrls": [],
  "findings": [],
  "riskFactors": [],
  "possibleHumorOrJoke": false,
  "impersonationDetected": false,
  "identityTheftRisk": "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN",
  "sensitiveInformationRequested": [],
  "identityRiskFindings": [],
  "explanation": "",
  "recommendedAction": ""
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: userContext ? `User context: ${userContext}\n\n${promptText}` : promptText },
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
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
      console.warn(`[Gemini Vision] API error (HTTP ${res.status}): ${errText}`);
      return generateMessageHeuristicFallback(
        userContext,
        `Gemini API returned status ${res.status}`
      );
    }

    const data = await res.json();

    if (data.promptFeedback?.blockReason) {
      console.warn(`[Gemini Vision] Prompt blocked: ${data.promptFeedback.blockReason}`);
      return generateMessageHeuristicFallback(
        userContext,
        `Gemini prompt blocked (${data.promptFeedback.blockReason})`
      );
    }

    const candidate = data.candidates?.[0];
    if (candidate?.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
      console.warn(`[Gemini Vision] Candidate filtered with finishReason: ${candidate.finishReason}`);
      return generateMessageHeuristicFallback(
        userContext,
        `Gemini output filtered (${candidate.finishReason})`
      );
    }

    const candidateText = candidate?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return generateMessageHeuristicFallback(userContext, 'Gemini returned empty candidate text');
    }

    const jsonMatch = candidateText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      candidateText.match(/```\s*([\s\S]*?)\s*```/);
    const cleanedJson = jsonMatch ? jsonMatch[1].trim() : candidateText.trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.warn(`[Gemini Vision] JSON parse failed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      return generateMessageHeuristicFallback(userContext, 'Gemini response was not valid JSON');
    }

    const validClassifications: MessageThreatClassification[] = ['LEGITIMATE', 'SUSPICIOUS', 'SCAM', 'UNKNOWN'];
    const classification: MessageThreatClassification = validClassifications.includes(
      parsed.classification as MessageThreatClassification
    )
      ? (parsed.classification as MessageThreatClassification)
      : 'UNKNOWN';

    const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'UNKNOWN'] as const;
    type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
    const identityTheftRisk: RiskLevel = validRiskLevels.includes(parsed.identityTheftRisk as RiskLevel)
      ? (parsed.identityTheftRisk as RiskLevel)
      : 'UNKNOWN';

    const confidence = typeof parsed.confidence === 'number' ? Math.min(100, Math.max(0, parsed.confidence)) : 75;

    const extractedText = typeof parsed.extractedText === 'string' ? parsed.extractedText : '';
    const detectedLanguage = typeof parsed.detectedLanguage === 'string'
      ? parsed.detectedLanguage
      : (extractedText ? detectLanguageFromText(extractedText) : 'Unknown');

    const rawModelUrls = Array.isArray(parsed.extractedUrls) ? (parsed.extractedUrls as string[]) : [];
    const regexUrls = extractedText ? extractUrlsFromText(extractedText) : [];
    const verifiedModelUrls = rawModelUrls.filter((u) => {
      if (typeof u !== 'string') return false;
      if (!extractedText) return true;
      const stripped = u.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');
      return stripped.length === 0 || extractedText.toLowerCase().includes(stripped.toLowerCase());
    });
    const combinedUrls = Array.from(new Set([...regexUrls, ...verifiedModelUrls]));

    return {
      classification,
      confidence,
      extractedText,
      detectedLanguage,
      explanationInDetectedLanguage: typeof parsed.explanationInDetectedLanguage === 'string' ? parsed.explanationInDetectedLanguage : undefined,
      extractedUrls: combinedUrls,
      findings: Array.isArray(parsed.findings) ? (parsed.findings as string[]) : [],
      riskFactors: Array.isArray(parsed.riskFactors) ? (parsed.riskFactors as string[]) : [],
      possibleHumorOrJoke: Boolean(parsed.possibleHumorOrJoke),
      impersonationDetected: Boolean(parsed.impersonationDetected),
      identityTheftRisk,
      sensitiveInformationRequested: Array.isArray(parsed.sensitiveInformationRequested)
        ? (parsed.sensitiveInformationRequested as string[])
        : [],
      identityRiskFindings: Array.isArray(parsed.identityRiskFindings)
        ? (parsed.identityRiskFindings as string[])
        : [],
      explanation: typeof parsed.explanation === 'string' ? parsed.explanation : 'Analysis completed from visual message evidence.',
      recommendedAction: typeof parsed.recommendedAction === 'string' ? parsed.recommendedAction : 'Exercise standard caution when receiving unsolicited requests.',
      modelUsed: model,
      fallbackUsed: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Gemini Vision] Request failed: ${message}`);
    return generateMessageHeuristicFallback(userContext, `Gemini Vision request error: ${message}`);
  }
}

/**
 * Defensive fallback when Gemini Vision API is offline or key is unconfigured.
 * Inspects userContext if provided, or marks as unanalyzed without hallucinating.
 */
function generateMessageHeuristicFallback(
  userContext?: string,
  fallbackReason?: string
): MessageInvestigationResult {
  const context = (userContext || '').toLowerCase();
  const findings: string[] = [];
  const riskFactors: string[] = [];
  const extractedUrls: string[] = [];
  const identityRiskFindings: string[] = [];
  const sensitiveInformationRequested: string[] = [];

  // Look for any URLs in userContext
  const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[^\s]*)/gi;
  const foundUrls = context.match(urlRegex);
  if (foundUrls) {
    foundUrls.forEach((u) => extractedUrls.push(u));
  }

  // Check for common money / celebrity impersonation keywords
  const moneyPatterns = ['send me', 'send money', '10000', 'dollars', 'crypto', 'gift card', 'wire'];
  const hasMoneyRequest = moneyPatterns.some((p) => context.includes(p));

  const impersonationPatterns = ['michael jackson', 'elvis', 'ceo', 'fbi', 'irs', 'bank support'];
  const hasImpersonation = impersonationPatterns.some((p) => context.includes(p));

  const urgencyPatterns = ['immediately', 'urgent', 'closed today', 'suspended', '24 hours'];
  const hasUrgency = urgencyPatterns.some((p) => context.includes(p));

  const sensitivePatterns = ['otp', 'password', 'pin', 'credit card', 'ssn', 'social security', 'account number'];
  const hasSensitiveRequest = sensitivePatterns.some((p) => context.includes(p));
  if (hasSensitiveRequest) {
    sensitivePatterns.forEach((p) => {
      if (context.includes(p)) sensitiveInformationRequested.push(p.charAt(0).toUpperCase() + p.slice(1));
    });
  }

  const isObviousJoke = context.includes('michael jackson') || context.includes('yo bro');

  let classification: MessageThreatClassification = 'UNKNOWN';
  let confidence = 50;
  let identityTheftRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' = 'UNKNOWN';

  if (hasMoneyRequest && hasImpersonation) {
    classification = 'SUSPICIOUS';
    confidence = 85;
    findings.push('The sender makes an unusual or implausible identity claim');
    findings.push('The message requests money or financial transfer');
    riskFactors.push('Impersonation', 'Financial Solicitation');
    identityRiskFindings.push('Sender identity claim appears implausible');
    identityTheftRisk = 'MEDIUM';
  } else if (hasUrgency && extractedUrls.length > 0) {
    classification = 'SCAM';
    confidence = 88;
    findings.push('The message uses coercive urgency to prompt an immediate link click');
    findings.push('External link provided with account closure or penalty warning');
    riskFactors.push('Urgency Pressure', 'Deceptive Link');
    identityTheftRisk = 'HIGH';
    identityRiskFindings.push('Coercive urgency combined with a link is a common credential-theft pattern');
  } else {
    findings.push(`Automated image evaluation unavailable (${fallbackReason || 'Vision engine in standby'}).`);
    identityTheftRisk = 'UNKNOWN';
  }

  return {
    classification,
    confidence,
    extractedText: userContext || 'Visible text extraction unavailable via heuristic fallback.',
    detectedLanguage: userContext ? detectLanguageFromText(userContext) : 'Unknown',
    extractedUrls,
    findings,
    riskFactors,
    possibleHumorOrJoke: isObviousJoke,
    impersonationDetected: hasImpersonation,
    identityTheftRisk,
    sensitiveInformationRequested,
    identityRiskFindings,
    explanation: isObviousJoke
      ? 'This message appears playful or joking, but contains an unusual identity claim and a request for money. Treat with caution.'
      : 'Evaluated via defensive heuristic fallback. Exercise caution before trusting unsolicited messages.',
    recommendedAction: 'Do not send money, OTPs, or credentials based on this communication.',
    modelUsed: 'Heuristic Message Evaluator',
    fallbackUsed: true,
  };
}
