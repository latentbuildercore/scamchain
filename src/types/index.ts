/**
 * SCAMCHAIN — Core Domain Models & Types
 * Defensive AI Investigation Platform
 */

export type ThreatStatus = 'active' | 'emerging' | 'monitoring' | 'neutralized' | 'archived';

export type ThreatClassification = 'LEGITIMATE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'UNKNOWN';

export type IndicatorCategory =
  | 'dns'
  | 'ssl_certificate'
  | 'html_structure'
  | 'kit_fingerprint'
  | 'brand_impersonation'
  | 'payment_gateway'
  | 'redirect_chain'
  | 'telegram_c2'
  | 'wallet_address';

export interface Indicator {
  id: string;
  category: IndicatorCategory;
  name: string;
  value: string;
  confidence: number; // 0.0 - 1.0
  firstObserved: string;
  lastObserved: string;
  sharedCount: number; // How many incidents share this indicator
  context?: string;
}

export interface WebsiteDna {
  structuralHash: string; // DOM structure fingerprint
  visualTheme: string; // Impersonated visual template
  kitSignature?: string; // Identified turnkey phishing kit (e.g., Kr3pto, Tycoon, EvilProxy)
  sslFingerprint?: string; // JA3 / JA4 / Cert Serial pattern
  registrar: string;
  nameservers: string[];
  autonomousSystem: string; // ASN / Hosting ISP
  extractedBrands: string[]; // Targeted brand or entity
  c2Endpoints?: string[]; // Drop servers / Telegram exfil channels
}

export interface Incident {
  id: string;
  campaignId?: string;
  submittedUrl: string;
  normalizedDomain: string;
  reportedAt: string;
  victimVector?: 'sms_phishing' | 'email_phishing' | 'sponsored_search' | 'social_media' | 'qr_code' | 'unknown';
  userNotes?: string;
  screenshotUrl?: string;
  dna: WebsiteDna;
  indicators: Indicator[];
  status: 'pending' | 'investigated' | 'correlated' | 'closed';
  similarityScore?: number; // Similarity to connected campaign
  summary?: string;
  isSyntheticDemo: boolean;
}

export interface Campaign {
  id: string;
  code: string; // e.g. "C-17"
  name: string;
  description: string;
  status: ThreatStatus;
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
  firstSeen: string;
  lastActive: string;
  relatedIncidentsCount: number;
  relatedDomainsCount: number;
  sharedIndicatorsCount: number;
  targetedBrands: string[];
  kitFingerprint?: string;
  primaryVector: string;
  indicators: Indicator[];
  incidentIds: string[];
  isSyntheticDemo: boolean;
}

export interface Investigation {
  id: string;
  targetUrl: string;
  contextText?: string;
  screenshotProvided: boolean;
  status: 'queued' | 'parsing_url' | 'preparing_investigation' | 'building_evidence_profile' | 'completed' | 'engine_standby';
  stageMessage: string;
  createdAt: string;
  completedAt?: string;
  resultSummary?: string;
  demoNotice: string;
}

export interface IntelligenceSummary {
  syntheticIncidents: number;
  syntheticCampaigns: number;
  activeCampaigns: number;
  emergingCampaigns: number;
  monitoringCampaigns: number;
  totalIndicatorsTracked: number;
  lastSyncTimestamp: string;
}

export interface ThreatGraphNode {
  id: string;
  label: string;
  type: 'incident' | 'domain' | 'brand' | 'campaign' | 'indicator' | 'infrastructure';
  subtext?: string;
  status?: ThreatStatus;
  isNew?: boolean;
}

export interface ThreatGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relationType: 'belongs_to' | 'resolves_to' | 'impersonates' | 'shares_indicator' | 'hosts';
}

export interface ThreatGraphData {
  nodes: ThreatGraphNode[];
  edges: ThreatGraphEdge[];
}

// =============================================================================
// PHASE 2 REAL INVESTIGATION ENGINE TYPES
// =============================================================================

export interface ObservedSignals {
  normalizedUrl: string;
  hostname: string;
  finalUrl: string;
  redirectCount: number;
  redirectChain: string[];
  httpStatus: number | string;
  statusText: string;
  pageTitle: string;
  securityHeaders: {
    contentSecurityPolicy: string;
    strictTransportSecurity: string;
    xFrameOptions: string;
    xContentTypeOptions: string;
    server: string;
    [key: string]: string;
  };
  visibleTextSnippet: string;
  externalDomains: string[];
  tlsMetadata: {
    protocol: string;
    isSecure: boolean;
    hstsEnforced: boolean;
    certificateIssuer: string;
  };
  rawFetchError?: string;
}

export interface ThreatIntelligenceResult {
  provider: string;
  status: 'Clean (Not Listed)' | 'Listed' | 'Unavailable';
  listed: boolean;
  threatTypes: string[];
  details: string;
  queriedAt: string;
}

export interface GeminiAnalysisResult {
  claimedOrganization: string;
  sitePurpose: string;
  suspiciousSignals: string[];
  benignSignals: string[];
  identityConsistency: 'Consistent' | 'Inconsistent' | 'Suspicious' | 'Unknown';
  potentialPhishingIndicators: string[];
  possibleCampaignCharacteristics: string[];
  classification: ThreatClassification;
  confidence: number;
  explanation: string;
  recommendedActions: string[];
  modelUsed: string;
  fallbackUsed?: boolean;
}

export interface CompactWebsiteDNA {
  hostname: string;
  claimedBrand: string;

  // Core observable fingerprints
  pageFeatures: string[];
  externalDomains: string[];
  redirectSignature: string[];
  securitySignals: string[];
  identitySignals: string[];

  // Advanced correlation fingerprints
  structuralHash?: string;
  visualTheme?: string;
  kitSignature?: string;
  sslFingerprint?: string;
  registrar?: string;
  nameservers?: string[];
  autonomousSystem?: string;
  extractedBrands?: string[];
  c2Endpoints?: string[];
}

export interface InvestigationRecord {
  id: string;
  createdAt: string;
  url: string;
  normalizedUrl: string;
  contextText?: string;

  classification: ThreatClassification;
  confidence: number;

  observedSignals: ObservedSignals;
  threatIntelligence: ThreatIntelligenceResult;
  geminiAnalysis: GeminiAnalysisResult;
  websiteDNA: CompactWebsiteDNA;

  campaignIds: string[];

  campaignRelationship?: string;

  campaignMatches?: Array<{
    campaignId: string;
    score: number;
    evidence: string[];
  }>;

  recommendations: string[];

  storageSource: 'firestore' | 'local_fallback';
}

// =============================================================================
// SCREENSHOT MESSAGE INVESTIGATION TYPES
// =============================================================================

export type MessageThreatClassification = 'LEGITIMATE' | 'SUSPICIOUS' | 'SCAM' | 'UNKNOWN';

export interface MessageInvestigationResult {
  classification: MessageThreatClassification;
  confidence: number; // 0 - 100
  extractedText: string;
  detectedLanguage?: string; // e.g. English, Hindi, Hinglish, Kannada, Tamil, Telugu, Mixed
  explanationInDetectedLanguage?: string; // Optional concise explanation in detected language
  extractedUrls: string[];
  findings: string[];
  riskFactors: string[];
  possibleHumorOrJoke: boolean;
  impersonationDetected: boolean;
  identityTheftRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  sensitiveInformationRequested: string[];
  identityRiskFindings: string[];
  recommendedAction: string;
  explanation: string;
  modelUsed: string;
  fallbackUsed?: boolean;
}

export interface MessageInvestigationRecord {
  id: string;
  createdAt: string;
  classification: MessageThreatClassification;
  confidence: number;
  investigationType?: 'message' | 'screenshot';
  messageAnalysis: MessageInvestigationResult;
  extractedUrls: string[];
  urlInvestigation?: InvestigationRecord;
}
