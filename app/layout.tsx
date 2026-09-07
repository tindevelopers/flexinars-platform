import type { Metadata } from "next";
import { AdminShellProvider } from "@tindevelopers/platform-ui";
import AppShell from "../components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Global Flexinars — CE Platform Admin",
  description:
    "Admin panel for the Global Flexinars Continuing-Education platform. Dependency-mode consumer of the @tindevelopers/* shell packages.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AdminShellProvider overrides={{}}>
          <AppShell>{children}</AppShell>
        </AdminShellProvider>
      </body>
    </html>
  );
}
