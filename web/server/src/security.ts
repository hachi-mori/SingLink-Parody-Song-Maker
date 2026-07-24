const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
}

export function isLoopbackHost(host: string): boolean {
  return loopbackHosts.has(normalizeHost(host));
}

export function parseAllowedLocalOrigins(value: string | undefined): string[] {
  const candidates = (value ?? 'http://127.0.0.1:5173,http://localhost:5173,http://[::1]:5173')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const origins: string[] = [];
  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      if (url.protocol !== 'http:' || !isLoopbackHost(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
        continue;
      }
      if (!origins.includes(url.origin)) {
        origins.push(url.origin);
      }
    } catch {
      // Invalid environment values are intentionally ignored rather than made public.
    }
  }
  return origins;
}

export function isAllowedLocalOrigin(origin: string | undefined, allowedOrigins: readonly string[]): boolean {
  if (!origin) return false;
  try {
    return allowedOrigins.includes(new URL(origin).origin);
  } catch {
    return false;
  }
}

export function normalizeLocalVoicevoxBaseUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'http:'
      || !isLoopbackHost(url.hostname)
      || url.port !== '50021'
      || url.username
      || url.password
      || url.pathname !== '/'
      || url.search
      || url.hash
    ) {
      return undefined;
    }
    return url.origin;
  } catch {
    return undefined;
  }
}
