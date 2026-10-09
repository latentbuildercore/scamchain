# SCAMCHAIN

> **"Don't just detect the threat. Reconstruct the attack."**

---

## 🛡️ Core Purpose

**SCAMCHAIN** is a defensive AI threat investigation platform that empowers users to investigate suspicious websites and messages, understand evidence-based scam and impersonation risks, and explore potential relationships between investigated incidents and known threat campaigns.

Rather than producing a single opaque suspicion score, SCAMCHAIN safely collects observable technical signals, performs grounded Gemini AI analysis, generates a **Website DNA** technical fingerprint, and identifies potential relationships with known threat infrastructure clusters.

---

## 🚀 Supported Investigation Modes

1. **Website / URL Investigation (`POST /api/investigate`)**:
   - Validates URL syntax and enforces strict SSRF protections (blocking loopback, private RFC1918/RFC6598 ranges, AWS/GCP metadata endpoints).
   - Conducts passive, read-only signal collection (DNS, TLS, HTTP response headers, redirect chains, external domains).
   - Synthesizes findings via Google Gemini (`gemini-2.0-flash`) with deterministic offline heuristic fallback.
   - Computes Website DNA and matches technical indicators against threat campaigns.

2. **Pasted Message Investigation (`POST /api/investigate-message`)**:
   - Dedicated text analysis accepting suspicious SMS, WhatsApp, Telegram, or email messages (up to 5,000 characters).
   - Identifies fake KYC threats, coercive urgency, OTP/credential solicitation, and financial demands.
   - Differentiates between obvious humor/banter/memes and authentic fraud.
   - Discovers web URLs verbatim without fabricating placeholders, providing optional one-click investigation via the URL pipeline.

3. **Screenshot Investigation (`POST /api/investigate-screenshot`)**:
   - Secure multimodal vision analysis using Gemini multimodal vision input.
   - Enforces strict image validation (PNG, JPG, JPEG, WebP; maximum 3 MB).
   - Memory-only processing: uploaded screenshot buffers are **never** stored permanently on disk or in databases.
   - Extracts verbatim message text, assesses visual deception/impersonation, and extracts embedded URLs.

---

## 🌐 Multilingual Support & Localization

### Supported Languages
1. **English (`en`)**
2. **Hindi (`hi`)** — हिन्दी (Devanagari script)
3. **Hinglish (`hinglish`)** — Romanized Hindi & English code-switching
4. **Kannada (`kn`)** — ಕನ್ನಡ (Kannada script & Romanized Kannada)
5. **Tamil (`ta`)** — தமிழ் (Tamil script & Romanized Tamil)
6. **Telugu (`te`)** — తెలుగు (Telugu script & Romanized Telugu)

### Automatic Detection & Manual Override
- **Automatic Detection**: When enabled, the application detects the dominant language from submitted messages or screenshots and dynamically adapts the entire interface (navigation, headings, forms, threat findings, and reports) to that language.
- **Manual Language Selection**: Users can manually select any supported language from the accessible `LanguageSelector` dropdown in the navigation header.
- **Manual Lock**: When a user manually selects a language, automatic detection is locked so subsequent message analyses do not override the user's manual choice. Users can re-enable Automatic detection at any time.
- **Persistence**: Language selection is persisted in `localStorage` across page navigation and reloads.
- **Detection Boundaries**: Ambiguous or short unidentifiable phrases retain the currently selected language rather than triggering arbitrary switching.

---

## ⚙️ Configuration & Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

### 1. Google Gemini AI (Required for live multimodal analysis)
- `GEMINI_API_KEY`: Google AI Studio API key.
- `GEMINI_MODEL`: Model identifier (defaults to `gemini-2.0-flash`).
- *Offline Resilient Fallback*: If `GEMINI_API_KEY` is omitted, SCAMCHAIN automatically runs a deterministic multilingual heuristic engine that safely handles text and screenshots without throwing unhandled exceptions.

### 2. Google Safe Browsing (Optional)
- `SAFE_BROWSING_API_KEY`: API key for Google Safe Browsing Lookup API v4.
- If omitted, the engine notes the service as unconfigured and relies on observed signals and heuristic/Gemini analysis without inventing threat data.

### 3. Demonstration Mode
- `NEXT_PUBLIC_DEMO_MODE`: Set to `'true'` to enable deterministic testing fixtures (such as `https://uniswap-demo.invalid` matching synthetic Campaign C-17).

---

## 🔬 Campaign Correlation & Forensic Boundaries

- **Technical Similarity (0–100)**: Correlation scores reflect observable structural, technical, and branding overlap across documented indicators. Scores represent relationship strength (Strong / Moderate / Weak) and are **never** presented as statistical probabilities of attack coordination or proof of legal guilt.
- **No Attributive Claims**: SCAMCHAIN defensively analyzes observable signals and does not claim definitive criminal attribution or automated takedown capabilities.
- **Synthetic Demonstration Fixtures**: Pre-seeded demo campaigns (e.g. Campaign C-17, C-09, C-04) use synthetic demonstration data explicitly flagged with `isSyntheticDemo: true` for forensic transparency.

---

## ⚡ Local Setup, Tests & Verification

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Test Suite
```bash
npm test
```
Executes 59 automated test cases covering SSRF protection, language detection, heuristic analysis, campaign correlation, report integrity, upload validation, and pipeline isolation.

### 3. Type Checking
```bash
npm run typecheck
```
Executes TypeScript compilation check across all application files with 0 errors.

### 4. Production Build
```bash
npm run build
npm run start
```
Compiles and starts the Next.js production build using Turbopack.
