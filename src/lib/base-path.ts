/**
 * Base path when app is served under a subpath (e.g. /ignite).
 * Uses env at build time; at runtime in browser falls back to pathname so it works even if env wasn't inlined.
 */
export function getBasePath(): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/ignite")) {
    return "/ignite";
  }
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  return base ? `${base}${path.startsWith("/") ? path : `/${path}`}` : path;
}

/** Full API v1 base URL for client-side requests (same origin + basePath so cookies are sent). */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${getBasePath()}/api/v1`;
  }
  return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000/api/v1";
}
