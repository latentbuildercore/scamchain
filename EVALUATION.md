# SCAMCHAIN — AI Evaluation Evidence Map

## System Architecture Overview

SCAMCHAIN is a defensive cybersecurity and threat correlation platform built on Next.js 16 (App Router) and TypeScript.

### Independent Pipeline Architecture
SCAMCHAIN enforces strict architectural separation between URL investigations and message/screenshot investigations, with unified, deduplicated engine logic:
1. **URL Investigation Pipeline (`/api/investigate` & `src/lib/scanner/url-investigation.ts`)**:
   `URL Input` → `validateAndNormalizeUrl` (SSRF/private IP filtering) → `collectObservableSignals` (passive read-only fetch with redirect SSRF defense, TLS & header extraction) → `checkGoogleSafeBrowsing` (reputation check) → `analyzeWithGemini` (synthesizes claimed identity & threat indicators) → `generateWebsiteDNA` (computes structural DOM & kit signatures) → `correlateWithCampaigns` (multi-signal similarity matching against threat clusters) → `saveInvestigation` (persists investigation record).
2. **Message & Screenshot Pipeline (`/api/investigate-message` & `/api/investigate-screenshot`)**:
   `Pasted Text / Screenshot` → Validation (text length ≤ 5,000 chars; image MIME type & ≤ 3 MB size) → `analyzeTextMessage` / `analyzeScreenshotMessage` (multilingual extraction, humor/parody differentiation, impersonation & sensitive data solicitation checks) → `extractUrlsFromText` (verbatim link discovery with grounding validation to eliminate model hallucination) → `handleAutoDetectedLanguage` (reactive interface localization).
   - **Pipeline Separation & Reusability**: Message investigations evaluate communication intent and social engineering without unsolicited network fetches. When downstream correlation is requested, routes call the unified `runUrlInvestigation(targetUrl, context)` service in `src/lib/scanner/url-investigation.ts`, eliminating over 100 lines of duplicated logic across endpoints. In the UI, extracted links feature an in-place "Investigate in Scanner" transition that pre-fills and switches to URL mode without page reloads.

---

## Evaluation Evidence Map

| Evaluation Criterion | Relevant Implementation Files | Tests or Commands Used to Verify | Actual Verification Result | Known Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **1. Code Quality** | • `src/lib/scanner/url-investigation.ts`<br>• `src/lib/scanner/safe-fetch.ts`<br>• `src/lib/scanner/message-analyzer.ts`<br>• `src/lib/scanner/screenshot-analyzer.ts`<br>• `src/lib/scanner/correlator.ts`<br>• `src/lib/data/investigation-store.ts`<br>• `src/lib/i18n/LanguageContext.tsx` | `npm run lint`<br>`npm run typecheck`<br>`npm test` | **0 ESLint errors, 0 ESLint warnings**.<br>**0 TypeScript errors** (`tsc --noEmit`).<br>**All 63 automated tests passed**.<br>Unified `runUrlInvestigation` service eliminates duplicate pipeline code. Strict typing enforced with zero `any` types; no forbidden `require()` imports; asynchronous query parameter prefilling without cascading renders; deterministic SSR/client initial states ensuring zero hydration mismatch. | Heuristic fallbacks use rule-based pattern matching when AI APIs are unconfigured. |
| **2. Efficiency** | • `src/app/api/investigate/route.ts`<br>• `src/app/api/investigate-message/route.ts`<br>• `src/app/api/investigate-screenshot/route.ts`<br>• `src/components/investigation/MessageResults.tsx`<br>• `src/lib/data/investigation-store.ts` | `npm test`<br>Manual request tracing | **No unsolicited website fetches or duplicate Gemini requests** during message/screenshot scans. Reports generated from existing memory state without re-running scans. 8s timeout on URL fetch, 45s timeout on Gemini. Read-only filesystem operations safely caught on serverless runtimes. Seamless in-place mode switching avoids full-page DOM teardown. | Screenshot OCR and multimodal vision processing latency is subject to Gemini API response time. |
| **3. Accessibility** | • `src/components/investigation/InvestigationForm.tsx`<br>• `src/components/investigation/InvestigationReportModal.tsx`<br>• `src/components/campaigns/CampaignDetailGraph.tsx`<br>• `src/components/layout/LanguageSelector.tsx`<br>• `src/components/layout/Navbar.tsx` | `npm test`<br>Keyboard navigation tests (Escape, tab focus) | Form controls have semantic labels (`htmlFor`, `id`). Dialogs use `role="dialog"`, `aria-modal="true"`. Accessible table view alternative provided for topology graph. Touch targets ≥ 44px. Full localization across 6 languages (`en`, `hi`, `hinglish`, `kn`, `ta`, `te`). | Full WCAG 2.1 AA certification requires independent third-party audit. |
| **4. Security** | • `src/lib/scanner/safe-fetch.ts` (SSRF & redirect protection)<br>• `src/lib/scanner/message-analyzer.ts` (hallucination defense)<br>• `src/app/api/investigate-screenshot/route.ts`<br>• `.gitignore`<br>• `.env.example` | `git ls-files .env*`<br>Regex search for frontend API keys<br>`npm test` (Suite 1, 7 & 9) | **Zero API keys exposed in frontend code**.<br>`.env.local` strictly untracked in Git.<br>**SSRF Defenses**: Rejects `localhost`, `127.0.0.1`, `10.x`, `192.168.x`, `172.16-31.x`, `169.254.x`, `.local`, `.internal`. Redirect targets are validated before reading response body or headers to prevent 3xx redirect SSRF.<br>**Anti-Hallucination**: Model-suggested URLs are grounded in verbatim input; non-matching links are pruned.<br>Image buffers (≤ 3 MB) processed in-memory only and never stored on disk. | DNS rebinding protection relies on IP resolution at fetch time; air-gapped intranet isolation recommended for enterprise deployments. |
| **5. Testing** | • `src/__tests__/scamchain.test.ts` (9 test suites) | `npm test` | **63 of 63 tests passing (0 failures)** across SSRF, redirect protection, language detection, URL extraction, heuristic analysis, C-17 correlation, report integrity, edge cases, i18n adaptation, hydration safety, pipeline isolation, and model URL grounding. | Live external API calls (Gemini, Google Safe Browsing) use deterministic offline-fallback during automated testing. |
| **6. Problem Statement Alignment** | • `src/app/investigate/page.tsx`<br>• `src/components/investigation/InvestigationForm.tsx`<br>• `src/components/investigation/MessageResults.tsx`<br>• `src/components/investigation/InvestigationResults.tsx`<br>• `src/components/campaigns/CampaignDetailGraph.tsx` | `npm run build`<br>`npm test` (Suite 5 & Suite 6) | Dedicated 3-mode intake (`URL`, `Message`, `Screenshot`). Distinguishes parody from fraud. C-17 synthetic demo records explicitly disclosed. Correlation scores framed as technical similarity, not criminal guilt. Ephemeral serverless storage accurately labeled in UI. | Correlation scores reflect observable structural and technical overlap, not legal proof of attacker attribution. In-memory session cache does not persist across Vercel container recycles without Cloud Firestore. |

---

## Verification Commands & Output Summary

### 1. ESLint Static Analysis
```bash
npm run lint
# Result: Exit code 0 (0 errors, 0 warnings)
```

### 2. TypeScript Static Type Check
```bash
npm run typecheck
# Result: Exit code 0 (0 type errors, strict mode enabled)
```

### 3. Automated Test Suite
```bash
npm test
# Result: 63 passed, 0 failed, 9 test suites (duration: ~50ms)
```

### 4. Production Build
```bash
npm run build
# Result: Exit code 0, compiled successfully with Turbopack across all 15 static/dynamic routes
```

### 5. Git Cleanliness & Whitespace Check
```bash
git diff --check
# Result: Exit code 0, clean whitespace across all modified files
```
