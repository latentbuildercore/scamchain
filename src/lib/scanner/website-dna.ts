import crypto from 'crypto';
import {
  CompactWebsiteDNA,
  GeminiAnalysisResult,
  ObservedSignals,
} from '@/types';

/**
 * Generates a deterministic Website DNA fingerprint
 * from actually observed investigation signals.
 *
 * Important:
 * This does NOT invent registrar, ASN, C2, or phishing-kit data.
 * Those fields are only populated when the scanner has real evidence.
 */
export function generateWebsiteDNA(
  signals: ObservedSignals,
  analysis: GeminiAnalysisResult
): CompactWebsiteDNA {
  const pageFeatures = [
    `http_status_${signals.httpStatus}`,
    signals.pageTitle !== 'Unavailable'
      ? 'has_page_title'
      : 'missing_page_title',
    signals.visibleTextSnippet.length > 500
      ? 'rich_content_body'
      : 'sparse_content_body',
    signals.redirectCount > 0
      ? 'redirected_endpoint'
      : 'direct_endpoint',
    signals.externalDomains.length > 0
      ? 'has_external_domains'
      : 'no_external_domains',
  ];

  const securitySignals = [
    signals.tlsMetadata.isSecure
      ? 'tls_https_active'
      : 'insecure_http_plain',
    signals.tlsMetadata.hstsEnforced
      ? 'hsts_header_enforced'
      : 'hsts_header_absent',
    signals.securityHeaders.contentSecurityPolicy !== 'Not Enforced'
      ? 'csp_header_enforced'
      : 'csp_header_absent',
    signals.securityHeaders.xFrameOptions !== 'Not Enforced'
      ? 'x_frame_options_set'
      : 'x_frame_options_none',
    signals.securityHeaders.xContentTypeOptions !== 'Not Enforced'
      ? 'x_content_type_options_set'
      : 'x_content_type_options_none',
  ];

  const redirectSignature = signals.redirectChain.map((url, index) => {
    try {
      return `hop_${index}:${new URL(url).hostname.toLowerCase()}`;
    } catch {
      return `hop_${index}:invalid`;
    }
  });

  const identitySignals = [
    `claimed_org:${analysis.claimedOrganization
      .toLowerCase()
      .trim()
      .slice(0, 80)}`,
    `identity_consistency:${analysis.identityConsistency}`,
  ];

  /*
   * Deterministic fingerprint of the observable page structure/signals.
   * This is NOT a claim that we know the site's actual DOM hash.
   */
  const fingerprintSource = JSON.stringify({
    hostname: signals.hostname.toLowerCase(),
    pageTitle: signals.pageTitle,
    redirectSignature,
    externalDomains: [...signals.externalDomains]
      .map((d) => d.toLowerCase())
      .sort(),
    securitySignals,
    identitySignals,
  });

  const structuralHash =
    `sha256:${crypto
      .createHash('sha256')
      .update(fingerprintSource)
      .digest('hex')
      .slice(0, 24)}`;

  const extractedBrands =
    analysis.claimedOrganization &&
    analysis.claimedOrganization !== 'Unknown / Not Stated'
      ? [analysis.claimedOrganization]
      : [];

  return {
    hostname: signals.hostname.toLowerCase(),
    claimedBrand: analysis.claimedOrganization || 'Unknown',

    pageFeatures: Array.from(new Set(pageFeatures)),
    externalDomains: signals.externalDomains
      .map((d) => d.toLowerCase())
      .slice(0, 15),
    redirectSignature,
    securitySignals,
    identitySignals,

    structuralHash,
    visualTheme: undefined,
    kitSignature: undefined,
    sslFingerprint: undefined,
    registrar: undefined,
    nameservers: undefined,
    autonomousSystem: undefined,
    extractedBrands,
    c2Endpoints: undefined,
  };
}
