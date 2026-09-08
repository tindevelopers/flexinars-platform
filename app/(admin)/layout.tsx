import { AdminShellProvider } from "@tindevelopers/platform-ui";
import { headers } from "next/headers";
import AppShell from "../../components/AppShell";
import { getTenantBySubdomain, getTenantFromHostname } from "@/lib/tenant";

/**
 * Layout for all authenticated admin routes.
 * Route protection is enforced by middleware.ts (redirects to /login);
 * this layout renders the branded admin shell (sidebar + header) around the
 * pages. The tenant brand color is resolved from the subdomain injected by the
 * middleware (`x-tenant-subdomain`), falling back to the Host header and finally
 * to the default indigo.
 */
const DEFAULT_BRAND = "#4F46E5";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const sub = h.get("x-tenant-subdomain");
  let tenant = sub ? await getTenantBySubdomain(sub) : null;
  if (!tenant) {
    const host = h.get("host");
    if (host) tenant = await getTenantFromHostname(host);
  }
  const brandColor = tenant?.brand_color ?? DEFAULT_BRAND;

  return (
    <AdminShellProvider overrides={{}}>
      <AppShell brandColor={brandColor}>{children}</AppShell>
    </AdminShellProvider>
  );
}
