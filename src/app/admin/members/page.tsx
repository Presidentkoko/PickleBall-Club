import type { Metadata } from "next";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/dashboard/search-input";
import { DataPagination } from "@/components/dashboard/data-pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MemberActions } from "@/components/admin/member-actions";
import { CreateMemberDialog } from "@/components/admin/create-member-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Members" };

const PAGE_SIZE = 10;

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim() || "";

  const where: Prisma.UserWhereInput = { role: { name: "MEMBER" } };
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        memberships: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true, type: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);
  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader title="Members" description="Manage club members and their membership status.">
        <CreateMemberDialog />
      </PageHeader>

      <div className="flex justify-end">
        <SearchInput placeholder="Search members…" />
      </div>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Members will appear here once people sign up."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Skill</TableHead>
                <TableHead>Membership</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const membership = m.memberships[0];
                return (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-medium">
                        {m.firstName} {m.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {m.skillLevel ? m.skillLevel.toLowerCase() : "—"}
                    </TableCell>
                    <TableCell>
                      {membership ? (
                        <StatusBadge status={membership.status} />
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={m.isActive ? "ACTIVE" : "DEACTIVATED"} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(m.createdAt, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <MemberActions
                        id={m.id}
                        isActive={m.isActive}
                        membershipStatus={membership?.status}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && <DataPagination page={page} pageCount={pageCount} total={total} />}
    </div>
  );
}
