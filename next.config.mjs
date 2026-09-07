/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The shell packages ship as ESM with "use client" directives and deep imports;
  // transpile them through Next so the App Router can consume them directly.
  transpilePackages: [
    "@tindevelopers/ui-shell",
    "@tindevelopers/platform-ui",
    "@tindevelopers/platform-core",
    "@tindevelopers/platform-schema",
    "@tindevelopers/base-core",
    "@tindevelopers/control-plane",
    "@base/core",
  ],
  // Allow the platform preview host to reach the dev server.
  allowedDevOrigins: ["*"],
};

export default nextConfig;
