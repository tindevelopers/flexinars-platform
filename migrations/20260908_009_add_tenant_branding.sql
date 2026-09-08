-- Phase 5: multi-tenant hardening + branding.
-- Adds subdomain-based tenant resolution and per-tenant brand styling.
--
-- NOTE: `slug` is added here (in addition to the three branding columns) because
-- the Phase 5 tenant utility (lib/tenant.ts getTenantFromSlug) and the seed both
-- rely on a stable, human-readable slug. The base tenants table shipped without
-- one. All statements are guarded so this migration is safely re-runnable.

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#4F46E5';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Enforce uniqueness for subdomain- and slug-based lookups. Unique indexes allow
-- multiple NULLs in Postgres, so pre-existing rows without values are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS tenants_subdomain_key ON tenants (subdomain);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_key ON tenants (slug);
