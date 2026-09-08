import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeadCell,
} from "@tindevelopers/platform-ui";
import StatusBadge from "../../../components/StatusBadge";
import { getTenants } from "../../../lib/queries";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function TenantsPage() {
  let tenants: Awaited<ReturnType<typeof getTenants>> = [];
  let error: string | null = null;
  try {
    tenants = await getTenants();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load tenants";
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          Tenants
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Organizations on the platform. Currently Global Flexinars only.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          Could not load tenants: {error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Domain</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Plan</TableHeadCell>
                <TableHeadCell>Region</TableHeadCell>
                <TableHeadCell>Courses</TableHeadCell>
                <TableHeadCell>Enrollments</TableHeadCell>
                <TableHeadCell>Created</TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell className="px-5 py-6 text-center text-gray-500">
                    No tenants yet.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="px-5 py-4 font-medium text-gray-800 dark:text-white/90">
                      {t.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500">
                      {t.domain}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500">
                      {t.plan}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500">
                      {t.region}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500">
                      {t.course_count}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500">
                      {t.enrollment_count}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-500">
                      {formatDate(t.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
