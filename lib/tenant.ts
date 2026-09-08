import "server-only";
import { query } from "@/lib/db";

/**
 * Phase 5 — tenant resolution utilities.
 *
 * Tenants are resolved from the request host (subdomain) so that the same
 * codebase can serve multiple branded CE experiences, e.g.
 *   globalflexinars.flexinars.com  → Global Flexinars Inc.
 *   demo.flexinars.com             → Demo Dental CE
 * In local dev the pattern is `<sub>.localhost:3000` (add the host to
 * /etc/hosts). When there is no subdomain we fall back to slug-based lookup.
 *
 * All DB access goes through the shared pool in lib/db.ts.
 */
export type Tenant = {
  id: string;
  name: string;
  slug: string | null;
  subdomain: string | null;
  brand_color: string | null;
  logo_url: string | null;
};

const TENANT_COLUMNS = "id, name, slug, subdomain, brand_color, logo_url";

/**
 * Extract the tenant subdomain from a raw host header (may include a port).
 * Returns null for bare hosts, `www`, IPs, and anything without a subdomain.
 * `<sub>.localhost` is treated as a valid subdomain for local development.
 * This is a pure function (no DB / no Node-only deps) so it can be reused by
 * the edge middleware.
 */
export function parseSubdomain(host: string | null | undefined): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].trim().toLowerCase();
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0") {
    return null;
  }
  const parts = hostname.split(".");
  const isLocalhost = parts[parts.length - 1] === "localhost";
  // `<sub>.localhost` needs >= 2 parts; a real domain needs >= 3 (sub.domain.tld).
  const minParts = isLocalhost ? 2 : 3;
  if (parts.length < minParts) return null;
  const sub = parts[0];
  if (!sub || sub === "www") return null;
  return sub;
}

/** Look up a tenant by its exact subdomain. */
export async function getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
  const value = subdomain.trim().toLowerCase();
  if (!value) return null;
  const rows = await query<Tenant>(
    `SELECT ${TENANT_COLUMNS} FROM tenants WHERE lower(subdomain) = $1 LIMIT 1`,
    [value]
  );
  return rows[0] ?? null;
}

/**
 * Resolve a tenant from a request hostname by parsing the first subdomain
 * segment and querying the tenants table. Returns null when there is no
 * subdomain or no matching tenant.
 */
export async function getTenantFromHostname(hostname: string): Promise<Tenant | null> {
  const subdomain = parseSubdomain(hostname);
  if (!subdomain) return null;
  return getTenantBySubdomain(subdomain);
}

/** Resolve a tenant by slug (used as a dev / single-domain fallback). */
export async function getTenantFromSlug(slug: string): Promise<Tenant | null> {
  const value = slug.trim().toLowerCase();
  if (!value) return null;
  const rows = await query<Tenant>(
    `SELECT ${TENANT_COLUMNS} FROM tenants WHERE lower(slug) = $1 LIMIT 1`,
    [value]
  );
  return rows[0] ?? null;
}
