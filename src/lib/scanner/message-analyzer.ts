import { MessageInvestigationResult, MessageThreatClassification } from '@/types';

/**
 * SCAMCHAIN — Dedicated Message Threat Analysis Service
 * Evaluates suspicious text messages in English, Hindi, Hinglish, Kannada, Tamil, Telugu, and mixed languages.
 * Grounded in observable message evidence, distinguishing genuine fraud from jokes/parody.
 */

// Regex for extracting web URLs without fabricating placeholders
const URL_REGEX = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+|[a-zA-Z0-9.-]+\.(?:com|org|net|edu|gov|io|co|in|xyz|top|cc|online|site|app|live|info|ru|cn)(?:\/[^\s<>"'{}|\\^`]*)?/gi;

/**
 * Analyzes pasted text message using Gemini API, with robust multilingual heuristic fallback.
 */
export async function analyzeTextMessage(
  messageText: string,
  userContext?: string
): Promise<MessageInvestigationResult> {
  const trimmed = messageText.trim();
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  if (!trimmed) {
    return {
      classification: 'UNKNOWN',
      confidence: 0,
      extractedText: '',
      detectedLanguage: 'Unknown',
      extractedUrls: [],
      findings: ['No message content provided for investigation.'],
      riskFactors: [],
      possibleHumorOrJoke: false,
      impersonationDetected: false,
      identityTheftRisk: 'UNKNOWN',
      sensitiveInformationRequested: [],
      identityRiskFindings: [],
      explanation: 'Please provide message text to initiate an analysis.',
      recommendedAction: 'Enter or paste a message into the text area.',
      modelUsed: 'None',
      fallbackUsed: true,
    };
  }

  // If Gemini API key is not configured, use heuristic evaluation
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '') {
    return generateMultilingualHeuristicFallback(
      trimmed,
      userContext,
      'GEMINI_API_KEY not configured in environment'
    );
  }

  const promptText = `You are a defensive AI cybersecurity and digital safety analyst for SCAMCHAIN.
Your task is to analyze the provided text message to determine if it exhibits indicators of phishing, financial fraud, impersonation, credential harvesting, fake KYC/job scams, or social engineering.

MULTILINGUAL SUPPORT:
The message may be written in:
- English
- Hindi (Devanagari script or transliterated Latin script)
- Hinglish (Hindi-English code-switching)
- Kannada (Kannada script or Romanized Kannada)
- Tamil (Tamil script or Romanized Tamil)
- Telugu (Telugu script or Romanized Telugu)
- Mixed-language or common colloquial phrasing / slang.

ANALYSIS REQUIREMENTS:
1. Classification: Exactly one of "SCAM", "SUSPICIOUS", "LEGITIMATE", "UNKNOWN".
   - SCAM: Clear malicious intent (e.g. credential theft, urgent fake KYC warning threatening account block with external link, OTP/PIN solicitation, fee-advance fraud, impersonation demanding payment).
   - SUSPICIOUS: Deceptive characteristics, implausible identity claims, money requests from unverified contacts, or high-pressure tactics.
   - LEGITIMATE: Ordinary personal, conversational, or authentic business communications without deceptive pressure or fraudulent requests.
   - UNKNOWN: Insufficient text or completely uninterpretable gibberish.
2. Confidence: Number between 0 and 100.
3. Extracted Text: Exact verbatim copy of the input message (preserve original script and spelling, NEVER alter or silently translate).
4. Detected Language: Specific language or combination, e.g.:
   "English", "Hindi", "Hinglish", "Kannada", "Tamil", "Telugu", "Mixed (Hindi / English)", "Mixed (Kannada / English)", etc., or "Unknown" if cannot be determined.
5. Explanation In Detected Language: If the detected language is Hindi, Hinglish, Kannada, Tamil, or Telugu, provide a 1-sentence concise warning/explanation in that language (using appropriate script or transliteration). If English, set to null.
6. Extracted URLs: Array of any web URLs or domain names extracted verbatim from the message. Return [] if none. DO NOT invent URLs.
7. Findings: Array of plain-English human-readable observations (e.g. "The message threatens that the recipient's bank account will be blocked", "The sender asks for a one-time verification code (OTP)").
8. Risk Factors: Specific tactics observed (e.g. "Fake KYC Warning", "Account Closure Threat", "Impersonation", "OTP Solicitation", "Financial Request", "Urgency Pressure", "Deceptive Link"). Return [] if legitimate.
9. Possible Humor Or Joke: boolean — true if the message is clearly satirical, playful banter, a meme, or a joke (e.g. "yo bro am michael jackson send me 10000").
10. Impersonation Detected: boolean — true if sender claims to be a bank, government body, celebrity, executive, or trusted organization.
11. Identity Theft Risk: Exactly one of "LOW", "MEDIUM", "HIGH", "UNKNOWN".
12. Sensitive Information Requested: Array of strings listing sensitive data solicited (e.g. "OTP", "Password", "PIN", "Bank Account Number", "Aadhaar", "PAN Card"). Return [] if none.
13. Identity Risk Findings: Array of plain-English explanations of identity/impersonation risks. Return [] if none.
14. Explanation: 2-3 sentence plain-English explanation answering: What did we notice, why could it be dangerous, and what could we not verify?
    If humorous/joke: explain that it appears playful, but note the financial/identity request responsibly without asserting real criminal attribution.
15. Recommended Action: Concrete, plain-English next steps for the user (e.g. "Do not share verification codes", "Contact your bank using official contact details from your card or bank statement").

CRITICAL EVIDENCE INTEGRITY RULES:
- Ground all findings strictly in the provided message.
- Do NOT classify informal slang, casual spelling, or regional vernacular as evidence of fraud.
- Distinguish between obvious jokes and actual malicious fraud.
- Output MUST be valid raw JSON only.

MESSAGE TO ANALYZE:
"""${trimmed}"""
${userContext ? `User context: """${userContext}"""` : ''}

Output JSON Schema:
{
  "classification": "SCAM" | "SUSPICIOUS" | "LEGITIMATE" | "UNKNOWN",
  "confidence": number,
  "extractedText": string,
  "detectedLanguage": string,
  "explanationInDetectedLanguage": string | null,
  "extractedUrls": string[],
  "findings": string[],
  "riskFactors": string[],
  "possibleHumorOrJoke": boolean,
  "impersonationDetected": boolean,
  "identityTheftRisk": "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN",
  "sensitiveInformationRequested": string[],
  "identityRiskFindings": string[],
  "explanation": string,
  "recommendedAction": string
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
            parts: [{ text: promptText }],
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
      console.warn(`[Gemini Message] API error (HTTP ${res.status}): ${errText}`);
      return generateMultilingualHeuristicFallback(
        trimmed,
        userContext,
        `Gemini API returned status ${res.status}`
      );
    }

    const data = await res.json();

    // Check for prompt-level safety blocks before accessing candidates
    if (data.promptFeedback?.blockReason) {
      console.warn(`[Gemini Message] Prompt blocked: ${data.promptFeedback.blockReason}`);
      return generateMultilingualHeuristicFallback(
        trimmed,
        userContext,
        `Gemini prompt blocked (${data.promptFeedback.blockReason})`
      );
    }

    const candidate = data.candidates?.[0];

    // Check finish reason — SAFETY / OTHER / RECITATION all produce empty parts
    if (candidate?.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
      console.warn(`[Gemini Message] Candidate filtered with finishReason: ${candidate.finishReason}`);
      return generateMultilingualHeuristicFallback(
        trimmed,
        userContext,
        `Gemini output filtered (finishReason: ${candidate.finishReason})`
      );
    }

    const candidateText = candidate?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return generateMultilingualHeuristicFallback(
        trimmed,
        userContext,
        'Gemini returned empty candidate text'
      );
    }

    const jsonMatch = candidateText.match(/```json\s*([\s\S]*?)\s*```/) ||
                      candidateText.match(/```\s*([\s\S]*?)\s*```/);
    const cleanedJson = jsonMatch ? jsonMatch[1].trim() : candidateText.trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (parseErr) {
      console.warn(`[Gemini Message] JSON parse failed: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
      return generateMultilingualHeuristicFallback(
        trimmed,
        userContext,
        'Gemini response was not valid JSON'
      );
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

    const confidence = typeof parsed.confidence === 'number'
      ? Math.min(100, Math.max(0, parsed.confidence))
      : 75;

    // Extract any URLs that might have been found by Gemini, plus regex validation
    const modelUrls = Array.isArray(parsed.extractedUrls) ? (parsed.extractedUrls as string[]) : [];
    const regexUrls = extractUrlsFromText(trimmed);
    const combinedUrls = Array.from(new Set([...modelUrls, ...regexUrls]));

    return {
      classification,
      confidence,
      extractedText: trimmed, // Always preserve verbatim user input
      detectedLanguage: typeof parsed.detectedLanguage === 'string' ? parsed.detectedLanguage : detectLanguageFromText(trimmed),
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
      explanation: typeof parsed.explanation === 'string'
        ? parsed.explanation
        : 'Message analyzed for observable threat signals.',
      recommendedAction: typeof parsed.recommendedAction === 'string'
        ? parsed.recommendedAction
        : 'Exercise standard caution when receiving unsolicited requests.',
      modelUsed: model,
      fallbackUsed: false,
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Gemini Message] Exception occurred: ${message}`);
    return generateMultilingualHeuristicFallback(
      trimmed,
      userContext,
      `Gemini request error: ${message}`
    );
  }
}

/**
 * Extracts all valid web URLs or domain patterns from text safely.
 */
export function extractUrlsFromText(text: string): string[] {
  const matches = text.match(URL_REGEX);
  if (!matches) return [];

  const results: string[] = [];
  for (const m of matches) {
    let clean = m.trim().replace(/[.,;!?]+$/, '');
    if (!clean) continue;
    if (!/^https?:\/\//i.test(clean) && !clean.startsWith('www.')) {
      clean = `https://${clean}`;
    }
    results.push(clean);
  }
  return Array.from(new Set(results));
}

/**
 * Helper to identify script or language markers for Indian languages and English.
 */
export function detectLanguageFromText(text: string): string {
  // Unicode ranges:
  // Devanagari (Hindi, Marathi, etc.): \u0900-\u097F
  // Kannada: \u0C80-\u0CFF
  // Tamil: \u0B80-\u0BFF
  // Telugu: \u0C00-\u0C7F
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasKannada = /[\u0C80-\u0CFF]/.test(text);
  const hasTamil = /[\u0B80-\u0BFF]/.test(text);
  const hasTelugu = /[\u0C00-\u0C7F]/.test(text);

  const lower = text.toLowerCase();

  // Native script detection
  if (hasDevanagari) return 'Hindi';
  if (hasKannada) return 'Kannada';
  if (hasTamil) return 'Tamil';
  if (hasTelugu) return 'Telugu';

  // Romanized Indian language markers
  const hinglishMarkers = [
    'aapka', 'aapki', 'apna', 'khata', 'ho jayega', 'karein', 'karo', 'paise',
    'bhejo', 'bhej', 'turant', 'kripya', 'naukri', 'lottery', 'bhai', 'inayat',
    'chahiye', 'band', 'nahi', 'karna', 'milenge', 'dekho', 'kripya', 'shukriya',
    'dost', 'kal milte', 'chai pe'
  ];
  const kannadaMarkers = [
    'nimma', 'khate', 'maadi', 'madi', 'aagide', 'hana', 'kalsi', 'dayavittu',
    'bega', 'illa', 'beku', 'hegiddira'
  ];
  const tamilMarkers = [
    'ungal', 'unggal', 'kanakku', 'mudakkappadum', 'panam', 'udane', 'kavanikavum',
    'illai', 'eppadi'
  ];
  const teluguMarkers = [
    'mee', 'khata', 'avuthundi', 'dabbulu', 'ventane', 'cheyandi', 'ledu', 'ela'
  ];

  const hasHinglish = hinglishMarkers.some((w) => lower.includes(w));
  const hasRomKannada = kannadaMarkers.some((w) => lower.includes(w));
  const hasRomTamil = tamilMarkers.some((w) => lower.includes(w));
  const hasRomTelugu = teluguMarkers.some((w) => lower.includes(w));

  const hasEnglishWords = /\b(the|is|are|your|you|account|please|update|send|verify|money|code|bank|immediately)\b/i.test(text);

  if (hasHinglish && hasEnglishWords) return 'Hinglish';
  if (hasHinglish) return 'Hindi (Romanized)';
  if (hasRomKannada && hasEnglishWords) return 'Mixed (Kannada / English)';
  if (hasRomKannada) return 'Kannada (Romanized)';
  if (hasRomTamil && hasEnglishWords) return 'Mixed (Tamil / English)';
  if (hasRomTamil) return 'Tamil (Romanized)';
  if (hasRomTelugu && hasEnglishWords) return 'Mixed (Telugu / English)';
  if (hasRomTelugu) return 'Telugu (Romanized)';

  // Pure English check
  if (/^[a-zA-Z0-9\s.,!?'"@#$%&*()_+=/:;-]+$/.test(text)) {
    return 'English';
  }

  return 'Unknown';
}

/**
 * Deterministic heuristic evaluation for multilingual messages when Gemini API is unconfigured.
 * Grounded in observable indicators, recognizing Hindi, Hinglish, Kannada, Tamil, Telugu, and English.
 */
export function generateMultilingualHeuristicFallback(
  messageText: string,
  userContext?: string,
  fallbackReason?: string
): MessageInvestigationResult {
  const combined = `${messageText} ${userContext || ''}`.toLowerCase();
  const rawText = messageText.trim();
  const detectedLanguage = detectLanguageFromText(rawText);
  const extractedUrls = extractUrlsFromText(rawText);

  const findings: string[] = [];
  const riskFactors: string[] = [];
  const identityRiskFindings: string[] = [];
  const sensitiveInformationRequested: string[] = [];

  // 1. Humor / Satire / Banter Check
  const jokeKeywords = ['michael jackson', 'yo bro', 'batman', 'superman', 'elvis', 'just a prank', 'just kidding', 'meme', 'lol'];
  const isObviousJoke = jokeKeywords.some((k) => combined.includes(k));

  // 2. Money / Financial Transfer Requests across languages
  const moneyTerms = [
    'send me', 'send money', 'send $', '$', '10000', '10,000', 'dollars', 'crypto', 'wire',
    'transfer', 'payment', 'fee', 'advance fee',
    'paise bhejo', 'paise transfer', 'rs.', 'inr', 'rupees', 'lakh', 'crore',
    'hana kalsi', 'panam anuppavum', 'dabbulu pampandi', 'gift card'
  ];
  const hasMoneyRequest = moneyTerms.some((t) => combined.includes(t));

  // 3. Impersonation Claims
  const impersonationTerms = [
    // Celebrity impersonation
    'michael jackson', 'elvis presley', 'batman', 'superman',
    // Executive / BEC scams
    'i am the ceo', 'i am ceo', 'am the cfo', 'am the cto', 'am your boss',
    'am the director', 'am the manager', 'am the md',
    // Banking / Government authority
    'bank manager', 'rbi officer', 'sbi support', 'hdfc bank',
    'icici bank', 'income tax', 'cbi', 'police', 'irs agent',
    // Logistics / Customer care impersonation
    'courier agent', 'fedex support', 'amazon customer care',
    // Recruitment scams
    'recruiter', 'hr manager',
  ];
  const hasImpersonation = impersonationTerms.some((t) => combined.includes(t));

  // 4. Fake KYC / Account Block threats across languages
  const kycOrAccountBlockTerms = [
    // English
    'account will be blocked', 'account suspended', 'kyc update', 'verify your account', 'pan not linked',
    // Hindi / Hinglish
    'account block ho jayega', 'khata block', 'kyc update karein', 'turant verify karein', 'pan card update', 'खाता ब्लॉक', 'केवाईसी अपडेट',
    // Kannada
    'account verify maadi', 'khate block aagide', 'ಖಾತೆ ಬ್ಲಾಕ್', 'ಪರಿಶೀಲಿಸಿ',
    // Tamil
    'kanakku mudakkappadum', 'கணக்கு முடக்கப்படும்', 'சரிபார்க்கவும்',
    // Telugu
    'khata block avuthundi', 'ఖాతా బ్లాక్', 'లాగిన్ అవ్వండి', 'వెంటనే'
  ];
  const hasAccountBlockThreat = kycOrAccountBlockTerms.some((t) => combined.includes(t));

  // 5. Sensitive data solicitation
  const sensitiveTerms = [
    { key: 'OTP', patterns: ['otp', 'one time password', 'verification code', 'ओटीपी', 'ఓటీపీ', 'ஓடிபி'] },
    { key: 'Password / PIN', patterns: ['password', 'pin', 'atm pin', 'पासवर्ड', 'పిన్'] },
    { key: 'Aadhaar / Identity Document', patterns: ['aadhaar', 'aadhar', 'pan card', 'आधार', 'పాన్ కార్డు'] },
    { key: 'Bank Account Details', patterns: ['account number', 'cvv', 'card number', 'credit card'] },
  ];

  for (const s of sensitiveTerms) {
    if (s.patterns.some((p) => combined.includes(p))) {
      sensitiveInformationRequested.push(s.key);
    }
  }

  // 6. Urgency markers
  const urgencyTerms = [
    'immediately', 'urgent', 'within 24 hours', 'today only', 'turant', 'jaldi',
    'bega', 'udane', 'ventane', 'warning', 'emergency'
  ];
  const hasUrgency = urgencyTerms.some((u) => combined.includes(u));

  // 7. Legitimate benign markers
  const benignTerms = [
    'meeting tomorrow', 'lunch', 'dinner', 'happy birthday', 'chai pe milte',
    'how are you', 'see you at', 'presentation review', 'project update',
    'kal milte hain', 'thanks for the update', 'let me know'
  ];
  const hasBenignMarkers = benignTerms.some((b) => combined.includes(b));

  // Determine classification and confidence
  let classification: MessageThreatClassification = 'UNKNOWN';
  let confidence = 50;
  let identityTheftRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN' = 'LOW';
  let explanationInDetectedLanguage: string | undefined = undefined;

  if (isObviousJoke) {
    // Ambiguous humor or joke
    classification = 'SUSPICIOUS';
    confidence = 80;
    findings.push('The message contains an implausible or unusual identity claim.');
    if (hasMoneyRequest) {
      findings.push('The message requests money or financial transfer.');
      riskFactors.push('Financial Request');
    }
    riskFactors.push('Humorous / Unverified Identity');
    identityRiskFindings.push('Unverified celebrity claim used in informal messaging context.');
    identityTheftRisk = 'MEDIUM';
  } else if (hasAccountBlockThreat && (extractedUrls.length > 0 || sensitiveInformationRequested.length > 0 || hasUrgency)) {
    // High-risk fake KYC / Account suspension scam
    classification = 'SCAM';
    confidence = 92;
    findings.push(`The message threatens account suspension or closure (${detectedLanguage}).`);
    if (sensitiveInformationRequested.length > 0) {
      findings.push(`Requests sensitive confidential credentials: ${sensitiveInformationRequested.join(', ')}.`);
      riskFactors.push('Credential Solicitation');
    }
    if (extractedUrls.length > 0) {
      findings.push('Includes an external link to resolve the alleged account issue.');
      riskFactors.push('Suspicious Link');
    }
    if (hasUrgency) {
      findings.push('Uses coercive urgency to compel immediate compliance.');
      riskFactors.push('Urgency Pressure');
    }
    riskFactors.push('Fake KYC / Impersonation Scam');
    identityRiskFindings.push('Coercive threats paired with credential or link requests are characteristic of account-takeover attacks.');
    identityTheftRisk = 'HIGH';

    if (detectedLanguage.includes('Hindi') || detectedLanguage.includes('Hinglish')) {
      explanationInDetectedLanguage = 'यह संदेश आपके बैंक खाते को ब्लॉक करने की धमकी देकर अनधिकृत लिंक या विवरण मांगता है। सावधान रहें।';
    } else if (detectedLanguage.includes('Kannada')) {
      explanationInDetectedLanguage = 'ಈ ಸಂದೇಶವು ನಿಮ್ಮ ಖಾತೆಯನ್ನು ನಿರ್ಬಂಧಿಸುವುದಾಗಿ ಬೆದರಿಕೆ ಹಾಕುತ್ತದೆ. ಯಾವುದೇ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.';
    } else if (detectedLanguage.includes('Tamil')) {
      explanationInDetectedLanguage = 'இந்தச் செய்தி உங்கள் வங்கிக் கணக்கு முடக்கப்படும் என அச்சுறுத்துகிறது. எந்தத் தகவலையும் பகிராதீர்கள்.';
    } else if (detectedLanguage.includes('Telugu')) {
      explanationInDetectedLanguage = 'ఈ సందేశం మీ బ్యాంక్ ఖాతా బ్లాక్ అవుతుందని బెదిరిస్తుంది. ఏ వివరాలనూ పంచుకోవద్దు.';
    }
  } else if (sensitiveInformationRequested.length > 0) {
    // Direct OTP / credential request
    classification = 'SCAM';
    confidence = 90;
    findings.push(`The message solicits sensitive confidential information: ${sensitiveInformationRequested.join(', ')}.`);
    findings.push('Legitimate institutions never request OTPs, passwords, or PINs over informal chat.');
    riskFactors.push('OTP / Credential Harvesting');
    identityRiskFindings.push('Sharing one-time codes can lead to immediate account compromise.');
    identityTheftRisk = 'HIGH';
  } else if (hasMoneyRequest && !hasBenignMarkers) {
    // Unsolicited financial solicitation
    classification = 'SUSPICIOUS';
    confidence = 75;
    findings.push('The message requests an unverified money transfer or payment.');
    if (hasImpersonation) {
      findings.push('The sender claims an authority or organizational identity that cannot be verified.');
      riskFactors.push('Impersonation');
    }
    riskFactors.push('Financial Solicitation');
    identityTheftRisk = 'MEDIUM';
    identityRiskFindings.push('Sender identity and legitimacy could not be independently verified from message text.');
  } else if (hasBenignMarkers && !hasAccountBlockThreat && sensitiveInformationRequested.length === 0) {
    // Legitimate routine communication
    classification = 'LEGITIMATE';
    confidence = 88;
    findings.push('Ordinary conversational exchange without fraudulent indicators or credential demands.');
    findings.push('No suspicious links, payment pressure, or coercive threats observed.');
    identityTheftRisk = 'LOW';
  } else {
    // Ambiguous
    classification = 'UNKNOWN';
    confidence = 45;
    findings.push(`Evaluated via multilingual heuristic engine (${fallbackReason || 'rule-based analysis'}).`);
    findings.push('Insufficient evidence to definitively confirm threat status.');
    identityTheftRisk = 'UNKNOWN';
  }

  // Plain-English explanation answering the key questions
  let explanation = '';
  if (isObviousJoke) {
    explanation = 'This message appears to be a joke, meme, or playful banter, but contains an unusual identity claim and a request for money. Verify the sender before taking action or transferring funds.';
  } else if (classification === 'SCAM') {
    explanation = `The message uses urgent threats about an account block (${detectedLanguage}) and requests sensitive credentials or link clicks. Sharing information could allow unauthorized account access. We could not verify the sender's identity.`;
  } else if (classification === 'SUSPICIOUS') {
    explanation = `The sender makes an unverified claim and requests payment or action. We could not verify the sender's identity from this text alone. Exercise caution before complying.`;
  } else if (classification === 'LEGITIMATE') {
    explanation = 'The message appears consistent with routine everyday communication. No threats, credential requests, or deceptive indicators were identified.';
  } else {
    explanation = `The message could not be conclusively verified (${fallbackReason || 'heuristic evaluation'}). Proceed with caution and do not share credentials.`;
  }

  // Plain-English recommended action
  let recommendedAction = '';
  if (classification === 'SCAM') {
    recommendedAction = 'Do not click any links, do not share OTPs or PINs, and contact your bank or organization using official contact numbers from your physical card or official website.';
  } else if (isObviousJoke) {
    recommendedAction = 'Treat playful messages with caution; never send money or account details even in a casual conversation without verifying the recipient.';
  } else if (classification === 'SUSPICIOUS') {
    recommendedAction = 'Independently verify the sender through a known, trusted telephone number before taking any financial action.';
  } else {
    recommendedAction = 'No immediate protective action required. Maintain standard awareness with unsolicited communications.';
  }

  return {
    classification,
    confidence,
    extractedText: rawText,
    detectedLanguage,
    explanationInDetectedLanguage,
    extractedUrls,
    findings,
    riskFactors,
    possibleHumorOrJoke: isObviousJoke,
    impersonationDetected: hasImpersonation || isObviousJoke,
    identityTheftRisk,
    sensitiveInformationRequested,
    identityRiskFindings,
    explanation,
    recommendedAction,
    modelUsed: 'Multilingual Defense Heuristic Engine',
    fallbackUsed: true,
  };
}
