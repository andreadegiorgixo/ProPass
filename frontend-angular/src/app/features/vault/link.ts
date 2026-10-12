const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
/** "localhost:8080/x": sembra uno schema ma è host e porta. */
const HOST_AND_PORT = /^[^/:]+:\d+(\/|$)/;

/**
 * URL da aprire, oppure null se il link non è apribile in sicurezza.
 * Si aprono solo http e https. Un link senza schema ("github.com") è trattato come https.
 * "javascript:", "data:", "mailto:" e simili non diventano mai un collegamento.
 */
export function safeHref(raw: string): string | null {
  const value = raw.trim();
  if (value === '' || /\s/.test(value)) {
    return null;
  }

  const scheme = SCHEME.exec(value)?.[1]?.toLowerCase();
  let candidate: string;
  if (scheme === 'http' || scheme === 'https') {
    candidate = value;
  } else if (scheme && !HOST_AND_PORT.test(value)) {
    return null;
  } else {
    candidate = `https://${value}`;
  }

  try {
    const url = new URL(candidate);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** Testo del link da mostrare: senza schema e senza "/" finale. */
export function displayLink(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '');
}
