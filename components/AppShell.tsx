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
