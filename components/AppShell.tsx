"use client";

import React from "react";
import {
  AdminLayout,
  AppSidebar,
  AppHeader,
  SidebarProvider,
  ThemeProvider,
  type ShellNavItem,
} from "@tindevelopers/ui-shell";

const navigation: { main: ShellNavItem[]; support: ShellNavItem[]; others: ShellNavItem[] } = {
  main: [
    { name: "Dashboard", path: "/" },
    { name: "Users", path: "/users" },
    { name: "Tenants", path: "/tenants" },
    { name: "Roles", path: "/roles" },
    { name: "Workspaces", path: "/workspaces" },
    { name: "Audit Logs", path: "/audit-logs" },
  ],
  support: [{ name: "Support", path: "/support" }],
  others: [{ name: "Settings", path: "/settings" }],
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
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <AdminLayout
          sidebar={<AppSidebar navigation={navigation} branding={branding} />}
          header={<AppHeader branding={branding} />}
        >
          {children}
        </AdminLayout>
      </SidebarProvider>
    </ThemeProvider>
  );
}
