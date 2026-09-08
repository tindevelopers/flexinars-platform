"use client";

import React, { type CSSProperties } from "react";
import {
  AdminLayout,
  AppSidebar,
  AppHeader,
  SidebarProvider,
  ThemeProvider,
  type ShellNavItem,
} from "@tindevelopers/ui-shell";

const DEFAULT_BRAND = "#4F46E5";

const navigation: { main: ShellNavItem[]; support: ShellNavItem[]; others: ShellNavItem[] } = {
  main: [
    { name: "Dashboard", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: "Learners", path: "/learners" },
    { name: "Tenants", path: "/tenants" },
    { name: "Reports", path: "/reports" },
  ],
  support: [],
  others: [],
};

const branding = {
  logo: null,
  favicon: null,
  companyName: "Global Flexinars CE Platform",
};

/**
 * Client-side admin shell wrapper. Composes the shell providers with the
 * AdminLayout + AppSidebar + AppHeader from @tindevelopers/ui-shell.
 */
export default function AppShell({
  children,
  brandColor = DEFAULT_BRAND,
}: {
  children: React.ReactNode;
  brandColor?: string;
}) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <div
          className="flex min-h-screen flex-col"
          style={{ "--brand": brandColor } as CSSProperties}
        >
          {/* Per-tenant brand accent strip across the top of the admin shell. */}
          <div
            className="h-1 w-full shrink-0"
            style={{ backgroundColor: "var(--brand)" }}
            aria-hidden
          />
          <div className="flex-1">
            <AdminLayout
              sidebar={<AppSidebar navigation={navigation} branding={branding} />}
              header={<AppHeader branding={branding} />}
            >
              {children}
            </AdminLayout>
          </div>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
