import {
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
} from "@tindevelopers/platform-ui";

const platformTables = [
  { name: "tenants", purpose: "Organizations / CE providers" },
  { name: "users", purpose: "Platform users" },
  { name: "roles", purpose: "RBAC role definitions" },
  { name: "user_tenant_roles", purpose: "Per-tenant role assignments" },
  { name: "workspaces", purpose: "Multi-workspace tenant model" },
  { name: "audit_logs", purpose: "Access / permission logging" },
  { name: "telemetry_events", purpose: "API call tracking" },
  { name: "agent_instances", purpose: "AI agent registry" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Global Flexinars — CE Platform Admin
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Phase 0 scaffold. Consuming the @tindevelopers/* shell packages in
          dependency mode, backed by Neon (Postgres) and Neon Managed Better Auth.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Database</p>
          <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Neon — connected
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Auth provider</p>
          <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            Neon Better Auth
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-sm text-gray-500">Migrations</p>
          <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
            15 tables applied
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Platform schema (Neon)
          </h2>
          <Button variant="primary">Refresh</Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Table</TableHeadCell>
                <TableHeadCell>Purpose</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platformTables.map((t) => (
                <TableRow key={t.name}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.purpose}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
