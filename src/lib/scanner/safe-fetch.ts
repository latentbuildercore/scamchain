import { ObservedSignals } from '@/types';

/**
 * Validates a submitted URL and protects against SSRF.
 */
export function validateAndNormalizeUrl(rawUrl: string): {
  valid: boolean;
  normalizedUrl: string;
  error?: string;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, normalizedUrl: '', error: 'URL is required' };
  }

  let trimmed = rawUrl.trim();

  // Reject explicitly non-http/https schemes before normalizing
  if (/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//i.test(trimmed)) {
    if (!/^https?:\/\//i.test(trimmed)) {
      return {
        valid: false,
        normalizedUrl: '',
        error: 'Only HTTP and HTTPS protocols are permitted',
      };
    }
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, normalizedUrl: '', error: 'Malformed URL format' };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, normalizedUrl: '', error: 'Only HTTP and HTTPS protocols are permitted' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF Protection: Deny loopback, private ranges, metadata endpoints
  const privateIpRegex =
    /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|::1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|169\.254\.\d+\.\d+)$/i;

  if (privateIpRegex.test(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return {
      valid: false,
      normalizedUrl: '',
      error: 'Access to private, loopback, or local infrastructure addresses is disallowed',
    };
  }

  // Ensure normalized URL has canonical lowercase protocol and hostname
  parsed.hostname = hostname;
  const normalizedUrl = parsed.toString();

  return { valid: true, normalizedUrl };
}

/**
 * Safely fetches a URL in read-only mode, extracting observable technical signals.
 * Never executes scripts, submits credentials, or exploits forms.
 */
export async function collectObservableSignals(targetUrl: string): Promise<ObservedSignals> {
  const urlObj = new URL(targetUrl);
  const hostname = urlObj.hostname;
  const isHttps = urlObj.protocol === 'https:';

  const defaultSignals: ObservedSignals = {
    normalizedUrl: targetUrl,
    hostname,
    finalUrl: targetUrl,
    redirectCount: 0,
    redirectChain: [targetUrl],
    httpStatus: 'Unavailable',
    statusText: 'Unavailable',
    pageTitle: 'Unavailable',
    securityHeaders: {
      contentSecurityPolicy: 'Unavailable',
      strictTransportSecurity: 'Unavailable',
      xFrameOptions: 'Unavailable',
      xContentTypeOptions: 'Unavailable',
      server: 'Unavailable',
    },
    visibleTextSnippet: 'Unavailable',
    externalDomains: [],
    tlsMetadata: {
      protocol: urlObj.protocol,
      isSecure: isHttps,
      hstsEnforced: false,
      certificateIssuer: isHttps ? 'Unavailable' : 'None (Insecure HTTP)',
    },
  };

  const controller = new AbortController();
  const timeoutMs = 8000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 ScamChain-ThreatScanner/2.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const finalUrl = response.url || targetUrl;
    const finalHost = new URL(finalUrl).hostname;
    const isRedirected = finalUrl !== targetUrl;

    const securityHeaders = {
      contentSecurityPolicy: response.headers.get('content-security-policy') || 'Not Enforced',
      strictTransportSecurity: response.headers.get('strict-transport-security') || 'Not Enforced',
      xFrameOptions: response.headers.get('x-frame-options') || 'Not Enforced',
      xContentTypeOptions: response.headers.get('x-content-type-options') || 'Not Enforced',
      server: response.headers.get('server') || 'Hidden / Unavailable',
    };

    const hstsEnforced = securityHeaders.strictTransportSecurity !== 'Not Enforced';

    // Safely read up to 1MB of text body
    let htmlText = '';
    try {
      const rawText = await response.text();
      htmlText = rawText.slice(0, 1024 * 1024); // max 1MB
    } catch {
      htmlText = '';
    }

    // Extract title
    let pageTitle = 'Unavailable';
    const titleMatch = htmlText.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      pageTitle = titleMatch[1].replace(/\s+/g, ' ').trim().slice(0, 200) || 'Untitled';
    }

    // Extract visible page text (clean tags and scripts)
    let visibleTextSnippet = 'Unavailable';
    if (htmlText) {
      const stripped = htmlText
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
        .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, ' ')
        .trim();

      visibleTextSnippet = stripped.slice(0, 2500) || 'No visible textual content extracted';
    }

    // Extract external domains referenced in HTML
    const externalDomainsSet = new Set<string>();
    const linkMatches = htmlText.matchAll(/(?:href|src|action)=["'](https?:\/\/[^"'\s>]+)["']/gi);
    for (const match of linkMatches) {
      try {
        const extHost = new URL(match[1]).hostname.toLowerCase();
        if (extHost && extHost !== hostname && extHost !== finalHost && !extHost.includes('w3.org')) {
          externalDomainsSet.add(extHost);
          if (externalDomainsSet.size >= 25) break;
        }
      } catch {
        // Ignore unparseable sub-links
      }
    }

    return {
      normalizedUrl: targetUrl,
      hostname,
      finalUrl,
      redirectCount: isRedirected ? 1 : 0,
      redirectChain: isRedirected ? [targetUrl, finalUrl] : [targetUrl],
      httpStatus: response.status,
      statusText: response.statusText || `${response.status}`,
      pageTitle,
      securityHeaders,
      visibleTextSnippet,
      externalDomains: Array.from(externalDomainsSet),
      tlsMetadata: {
        protocol: new URL(finalUrl).protocol,
        isSecure: new URL(finalUrl).protocol === 'https:',
        hstsEnforced,
        certificateIssuer: isHttps ? 'Verified TLS Handshake' : 'None (Insecure HTTP)',
      },
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isAbort = err instanceof Error && err.name === 'AbortError';

    return {
      ...defaultSignals,
      httpStatus: 'Unreachable',
      statusText: isAbort ? 'Connection Timed Out (8000ms)' : 'Host Unreachable / DNS Failed',
      rawFetchError: isAbort
        ? 'Request timed out after 8 seconds.'
        : `Network connection failed: ${errorMessage}`,
    };
  }
}
