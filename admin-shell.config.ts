/**
 * Global Flexinars CE Platform — admin shell configuration (Phase 0).
 *
 * Dependency-mode descriptor: records which published @tindevelopers/* packages
 * back this admin app and which platform modules are enabled. Kept as a
 * self-contained type so it does not depend on an internal shell export.
 */
export interface AdminShellConfig {
  packages: {
    baseCore: string;
    adminCore: string;
    adminUi: string;
    adminSchema: string;
  };
  modules: string[];
  mode: "dependency" | "workspace";
}

const config: AdminShellConfig = {
  packages: {
    baseCore: "@base/core",
    adminCore: "@tindevelopers/platform-core",
    adminUi: "@tindevelopers/platform-ui",
    adminSchema: "@tindevelopers/platform-schema",
  },
  modules: ["user-management", "role-management", "audit-logs"],
  mode: "dependency",
};

export default config;
