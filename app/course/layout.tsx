import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { headers } from "next/headers";
import "../globals.css";
import {
  getTenantBySubdomain,
  getTenantFromHostname,
  getTenantFromSlug,
  type Tenant,
} from "@/lib/tenant";

export const metadata: Metadata = {
  title: "Global Flexinars — Continuing Education",
  description:
    "Complete your continuing-education course: watch the video, pass the quiz, and submit your evaluation.",
};

export const viewport: Viewport = {
  themeColor: "#1D4ED8",
};

const DEFAULT_BRAND = "#1D4ED8";
const DEFAULT_SLUG = "globalflexinars";

/**
 * Resolve the tenant for the participant experience. The /course/* routes are
 * intentionally excluded from the auth middleware (token-gated, public), so the
 * `x-tenant-subdomain` header is usually absent here — we therefore resolve from
 * the raw Host header, then fall back to the default (Global Flexinars) tenant
 * so branding always renders.
 */
async function resolveTenant(): Promise<Tenant | null> {
  const h = await headers();
  const sub = h.get("x-tenant-subdomain");
  if (sub) {
    const bySub = await getTenantBySubdomain(sub);
    if (bySub) return bySub;
  }
  const host = h.get("host");
  if (host) {
    const byHost = await getTenantFromHostname(host);
    if (byHost) return byHost;
  }
  return getTenantFromSlug(DEFAULT_SLUG);
}

/**
 * Clean, public, mobile-responsive layout for the participant (clinician) CE
 * experience. Deliberately free of the admin shell. Branding (accent color +
 * logo/name) is driven by the resolved tenant; the accent is exposed as the
 * `--brand` CSS custom property so descendants can use `var(--brand)` /
 * `text-[var(--brand)]` / `bg-[var(--brand)]`.
 */
export default async function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await resolveTenant();
  const brand = tenant?.brand_color ?? DEFAULT_BRAND;
  const name = tenant?.name ?? "Global Flexinars";
  const logoUrl = tenant?.logo_url ?? null;

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50 text-slate-900"
      style={{ "--brand": brand } as CSSProperties}
    >
      <header className="border-b border-slate-200 bg-white">
        <div className="h-1 w-full bg-[var(--brand)]" aria-hidden />
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={`${name} logo`}
                className="h-8 w-auto max-w-[180px] object-contain"
              />
            ) : (
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  {name}
                </span>
                <span className="text-xs font-medium text-[var(--brand)]">
                  CE That Travels With You
                </span>
              </div>
            )}
          </div>
          <span className="hidden text-xs font-medium uppercase tracking-wide text-slate-400 sm:block">
            Continuing Education
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center text-xs text-slate-500">
          © 2026 {name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
