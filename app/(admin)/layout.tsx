import { AdminShellProvider } from "@tindevelopers/platform-ui";
import AppShell from "../../components/AppShell";

/**
 * Layout for all authenticated admin routes.
 * Route protection is enforced by middleware.ts (redirects to /login);
 * this layout renders the branded admin shell (sidebar + header) around the pages.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShellProvider overrides={{}}>
      <AppShell>{children}</AppShell>
    </AdminShellProvider>
  );
}
