# SCAMCHAIN — AI Evaluation Evidence Map

## System Architecture Overview

SCAMCHAIN is a defensive cybersecurity and threat correlation platform built on Next.js 16 (App Router) and TypeScript.

### Independent Pipeline Architecture
SCAMCHAIN enforces an architectural separation between URL investigations and message/screenshot investigations:
1. **URL Investigation Pipeline (`/api/investigate`)**:
   `URL Input` → `validateAndNormalizeUrl` (SSRF/private IP filtering) → `collectObservableSignals` (passive read-only fetch, TLS & header extraction) → `checkGoogleSafeBrowsing` (reputation check) → `analyzeWithGemini` (synthesizes claimed identity & threat indicators) → `generateWebsiteDNA` (computes structural DOM & kit signatures) → `correlateWithCampaigns` (multi-signal similarity matching against threat clusters) → `saveInvestigation` (persists investigation record).
2. **Message & Screenshot Pipeline (`/api/investigate-message` & `/api/investigate-screenshot`)**:
   `Pasted Text / Screenshot` → Validation (text length ≤ 5,000 chars; image MIME type & ≤ 5 MB size) → `analyzeTextMessage` / `analyzeScreenshotMessage` (multilingual extraction, humor/parody differentiation, impersonation & sensitive data solicitation checks) → `extractUrlsFromText` (verbatim link discovery without fabrication) → `handleAutoDetectedLanguage` (reactive interface localization).
   - **Why pipelines are separate**: Message investigations analyze communication intent, deceptive authority claims, and social engineering without assuming an external domain exists. Evaluating a message or screenshot does not force website fetching, preventing unsolicited outbound network calls and duplicate AI requests. Extracted URLs are presented with an optional "Investigate in Scanner" action that allows users to explicitly route them through the protected URL pipeline on demand.

---

## Evaluation Evidence Map

| Evaluation Criterion | Relevant Implementation Files | Tests or Commands Used to Verify | Actual Verification Result | Known Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **1. Code Quality** | • `src/lib/scanner/safe-fetch.ts`<br>• `src/lib/scanner/message-analyzer.ts`<br>• `src/lib/scanner/screenshot-analyzer.ts`<br>• `src/lib/scanner/correlator.ts`<br>• `src/lib/i18n/types.ts`<br>• `src/lib/i18n/LanguageContext.tsx` | `npm run typecheck`<br>`npm test` | **Passed cleanly (0 TypeScript errors)**.<br>59/59 automated tests passed.<br>Strict typing enforced across all investigation schemas. | Heuristic fallbacks use rule-based pattern matching when AI APIs are unconfigured. |
| **2. Efficiency** | • `src/app/api/investigate-message/route.ts`<br>• `src/app/api/investigate-screenshot/route.ts`<br>• `src/components/investigation/MessageResults.tsx` | `npm test`<br>Manual request tracing | **No unsolicited website fetches or duplicate Gemini requests** during message/screenshot scans. Reports generated from existing memory state without re-running scans. 8s timeout on URL fetch, 60s timeout on Gemini. | Screenshot OCR and multimodal vision processing latency is subject to Gemini API response time. |
| **3. Accessibility** | • `src/components/investigation/InvestigationForm.tsx`<br>• `src/components/investigation/InvestigationReportModal.tsx`<br>• `src/components/campaigns/CampaignDetailGraph.tsx`<br>• `src/components/layout/LanguageSelector.tsx`<br>• `src/components/layout/Navbar.tsx` | `npm test`<br>Keyboard navigation tests (Escape, tab focus) | Form controls have semantic labels (`htmlFor`, `id`). Dialogs use `role="dialog"`, `aria-modal="true"`. Accessible table view alternative provided for topology graph. Touch targets ≥ 44px. | Full WCAG 2.1 AA certification requires independent third-party audit. |
| **4. Security** | • `src/lib/scanner/safe-fetch.ts` (SSRF filter)<br>• `src/app/api/investigate-screenshot/route.ts`<br>• `.gitignore`<br>• `.env.example` | `git ls-files .env.local`<br>Regex search for frontend API keys<br>`npm test` (Suite 1 & Suite 7) | **Zero API keys exposed in frontend code**.<br>`.env.local` strictly untracked.<br>SSRF rejects `localhost`, `127.0.0.1`, `10.x`, `192.168.x`, `172.16-31.x`, `169.254.x`, `.local`, `.internal`. Image buffers processed in-memory only. | DNS rebinding protection relies on IP resolution at fetch time; air-gapped intranet isolation recommended for enterprise deployments. |
| **5. Testing** | • `src/__tests__/scamchain.test.ts` (9 test suites) | `npm test` | **59 of 59 tests passing (0 failures)** across SSRF, language detection, URL extraction, heuristic analysis, C-17 correlation, report integrity, edge cases, i18n adaptation, and pipeline isolation. | Live external API calls (Gemini, Google Safe Browsing) mocked/offline-fallback during automated testing. |
| **6. Problem Statement Alignment** | • `src/app/investigate/page.tsx`<br>• `src/components/investigation/InvestigationForm.tsx`<br>• `src/components/investigation/MessageResults.tsx`<br>• `src/components/investigation/InvestigationResults.tsx`<br>• `src/components/campaigns/CampaignDetailGraph.tsx` | `npm run build`<br>`npm test` (Suite 5 & Suite 6) | Dedicated 3-mode intake (`URL`, `Message`, `Screenshot`). Distinguishes parody from fraud. C-17 synthetic demo records explicitly disclosed. Correlation scores framed as technical similarity, not criminal guilt. | Correlation scores reflect observable structural and technical overlap, not legal proof of attacker attribution. |

---

## Verification Commands & Output Summary

### 1. Automated Test Suite
```bash
npm test
# Result: 59 passed, 0 failed, 9 test suites (duration: ~39ms)
```

### 2. TypeScript Static Type Check
```bash
npm run typecheck
# Result: Exit code 0, 0 type errors
```

### 3. Production Build
```bash
npm run build
# Result: Exit code 0, compiled successfully with Turbopack across all 15 static/dynamic routes
```

### 4. Git Cleanliness & Whitespace Check
```bash
git diff --check
# Result: Exit code 0, clean whitespace
```
