/**
 * Safe fetch utility that verifies Content-Type and handles server warm-up/HTML responses gracefully
 */
export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; status: number; error?: string }> {
  try {
    const headers = new Headers(options?.headers || {});
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const status = res.status;
    const contentType = res.headers.get('content-type') || '';

    // If server is starting up or nginx returns warmup.html, content-type is text/html
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        status,
        error: `Non-JSON response from server (${contentType || 'empty'})`,
      };
    }

    if (!res.ok) {
      let errText = `HTTP error ${status}`;
      try {
        const errJson = await res.json();
        errText = errJson.error || errJson.message || errText;
      } catch {
        // ignore
      }
      return {
        ok: false,
        status,
        error: errText,
      };
    }

    const data: T = await res.json();
    return {
      ok: true,
      data,
      status,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Network request failed',
    };
  }
}
