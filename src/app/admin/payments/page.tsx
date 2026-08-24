import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";
import { Prisma, type PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { SearchInput } from "@/components/dashboard/search-input";
import { DataPagination } from "@/components/dashboard/data-pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PaymentReviewDialog } from "@/components/admin/payment-review-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Payments" };

const PAGE_SIZE = 10;
const FILTERS = ["ALL", "PENDING", "VERIFIED", "REJECTED"] as const;

function peso(amount: unknown) {
  return `₱${Number(amount ?? 0).toLocaleString("en-PH")}`;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = sp.q?.trim() || "";
  const status = (sp.status || "PENDING").toUpperCase();

  const where: Prisma.PaymentWhereInput = {};
  if (status !== "ALL" && ["PENDING", "VERIFIED", "REJECTED"].includes(status)) {
    where.status = status as PaymentStatus;
  }
  if (q) {
    where.OR = [
      { referenceNumber: { contains: q, mode: "insensitive" } },
      {
        user: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.payment.count({ where }),
  ]);
  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Verify member payments and activate memberships." />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={`/admin/payments?status=${f}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                status === f
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </Link>
          ))}
        </div>
        <SearchInput placeholder="Search member or reference…" />
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments found"
          description="Payments will appear here as members submit them."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">
                      {p.user.firstName} {p.user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.user.email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{p.purpose.toLowerCase()}</TableCell>
                  <TableCell className="font-medium">{peso(p.amount)}</TableCell>
                  <TableCell>{p.method.replace("_", " ")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(p.createdAt, "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <PaymentReviewDialog
                      payment={{
                        id: p.id,
                        member: `${p.user.firstName} ${p.user.lastName}`,
                        amount: peso(p.amount),
                        method: p.method,
                        purpose: p.purpose,
                        status: p.status,
                        referenceNumber: p.referenceNumber,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && <DataPagination page={page} pageCount={pageCount} total={total} />}
    </div>
  );
}
