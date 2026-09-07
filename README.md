# Global Flexinars — CE Platform Admin (Phase 0)

Admin panel for the Global Flexinars Continuing-Education platform. This is a **new
consumer application** (App Router, TypeScript) that consumes the `@tindevelopers/*`
shell packages from GitHub Packages in **dependency mode** (not a fork), backed by
**Neon** (Postgres + Neon Managed Better Auth) and **Brevo** (email).

## Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- pnpm 10.6.1
- Tailwind CSS v4
- `@tindevelopers/ui-shell` → `AdminLayout`, `AppSidebar`, `AppHeader`
- `@tindevelopers/platform-ui` → `AdminShellProvider`, `Button`, `Table`, …
- `@tindevelopers/platform-core`, `@tindevelopers/platform-schema`, `@tindevelopers/base-core`, `@tindevelopers/control-plane`
- Neon (database + managed Better Auth), Brevo (email)

## Getting started
```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## Environment (`.env.local`, gitignored)
| Var | Status |
| --- | --- |
| `NEXT_PUBLIC_AUTH_PROVIDER` | `neon` |
| `DATABASE_URL` | ✅ wired (Neon pooled, secret — never committed) |
| `NEON_AUTH_COOKIE_SECRET` | ✅ generated (`openssl rand -base64 32`) |
| `NEON_AUTH_BASE_URL` | ⛔ **you must paste this** from the Neon console → Auth tab |
| `BREVO_API_KEY` | ⛔ **you must paste this** from Brevo |

See `.env.example` for the template.

## Database — migrations already applied
The `platform-schema` migrations from `tindevelopers/shell-base-admin`
(`packages/platform-schema/migrations/`) were run against the Neon database in
chronological order. 15 tables were created:

`tenants, users, roles, user_tenant_roles, workspaces, audit_logs,
telemetry_events, agent_instances, agent_usage_events, meeting_sessions,
meeting_summaries, meeting_transcripts, meeting_transcript_chunks,
telnyx_call_correlations, platform_sync_state`

## Package resolution — important

`.npmrc` maps the scope to GitHub Packages:
```
@tindevelopers:registry=https://npm.pkg.github.com
```
The auth token must live in a user-level `~/.npmrc` or a CI secret (a **PAT with
`read:packages`**), never committed here.

> **Local dev note:** the GitHub *App installation* token available in the build
> environment cannot read GitHub Packages (it lacks `read:packages`). So for local
> dev the `dependencies` in `package.json` use `link:../shell-base-admin/packages/*`
> pointing at locally-built copies of the shell packages, and the app runs fully.
>
> **For CI / production:** once you have a `read:packages` PAT, swap the `link:`
> specifiers back to the published versions listed under `_productionDependencies`
> in `package.json`, then `pnpm install`. Those published versions are:
> - `@base/core` → `npm:@tindevelopers/base-core@0.2.0-rc.4`
> - `@tindevelopers/base-core@0.2.0-rc.4`
> - `@tindevelopers/control-plane@0.2.0-rc.4`
> - `@tindevelopers/ui-shell@0.2.0-rc.4`
> - `@tindevelopers/platform-core@0.3.0-rc.4`
> - `@tindevelopers/platform-schema@0.3.0-rc.4`
> - `@tindevelopers/platform-ui@0.3.0-rc.4`

## Auth interface fix (contributed upstream)
The shell's `AuthConfig` only allowed `'supabase' | 'workos'`. A PR adds `'neon'`
and a `neon?` config block (`authBaseUrl`, `cookieSecret`):
**tindevelopers/shell-base-admin#2** (branch `feat/neon-auth-provider-type`).

## Structure
```
app/
  layout.tsx        # RootLayout → AdminShellProvider → <AppShell>
  page.tsx          # dashboard (stat cards + platform-schema table)
  globals.css       # Tailwind v4 entry
components/
  AppShell.tsx      # client shell: ThemeProvider + SidebarProvider + AdminLayout + AppSidebar + AppHeader
admin-shell.config.ts
next.config.mjs     # transpilePackages for the @tindevelopers/* packages
```
