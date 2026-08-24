import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireOwnerOrSuperAdmin } from "@/lib/auth/guards";
import { ROLE_LABELS } from "@/lib/auth/rbac";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateAdminDialog } from "@/components/admin/create-admin-dialog";
import { AdminAccountActions } from "@/components/admin/admin-account-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const me = await requireOwnerOrSuperAdmin();
  const team = await prisma.user.findMany({
    where: { role: { name: { in: ["OWNER", "SUPER_ADMIN", "ADMIN", "STAFF"] } } },
    include: { role: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Team" description="Manage admin and staff accounts and their roles.">
        <CreateAdminDialog />
      </PageHeader>

      {team.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No team accounts" description="Add your first admin or staff account." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.firstName} {u.lastName}
                    {u.id === me.id && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>{ROLE_LABELS[u.role.name] ?? u.role.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={u.isActive ? "ACTIVE" : "DEACTIVATED"} />
                  </TableCell>
                  <TableCell className="text-right">
                    {u.role.name === "OWNER" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <AdminAccountActions
                        id={u.id}
                        role={u.role.name}
                        isActive={u.isActive}
                        isSelf={u.id === me.id}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
