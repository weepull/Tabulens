import type { Report } from './types';

// Trailing slashes are stripped: 'https://x.onrender.com/' would otherwise
// produce '//api/analyze', which the server answers with a bare 404.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

/** Must match MAX_BYTES in server/src/routes/analyze.js. */
export const MAX_BYTES = 20 * 1024 * 1024;

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * POST the files to /api/analyze. The server's JSON `error` message is
 * written for humans, so it is surfaced as-is rather than replaced with a
 * generic one.
 */
export async function analyze(input: { file: File; test?: File | null; target?: string | null }): Promise<Report> {
  const body = new FormData();
  body.append('file', input.file);
  if (input.test) body.append('test', input.test);
  if (input.target) body.append('target', input.target);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body });
  } catch {
    // The browser hides the reason. A server that rejects this site's origin
    // (403 without CORS headers) fails here exactly like one that is down.
    const origin = typeof window === 'undefined' ? 'this site' : window.location.origin;
    throw new ApiError(
      `Could not reach the analysis server at ${API_URL}. It may be down, or this site's origin ` +
        `(${origin}) may not be in its ALLOWED_ORIGINS.`,
      0,
    );
  }

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(json?.error || `Request failed with status ${res.status}`, res.status);
  return json as Report;
}
