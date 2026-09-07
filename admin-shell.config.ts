import type { AdminShellConfig } from "@tindevelopers/platform-core";

/**
 * Global Flexinars CE Platform — admin shell configuration (Phase 0).
 * Dependency-mode: the app consumes the published @tindevelopers/* packages.
 */
const config: AdminShellConfig = {
  packages: {
    baseCore: "@base/core",
    adminCore: "@tindevelopers/platform-core",
    adminUi: "@tindevelopers/platform-ui",
    adminSchema: "@tindevelopers/platform-schema",
  },
  modules: ["user-management", "role-management", "audit-logs"],
  mode: "dependency",
} as AdminShellConfig;

export default config;
