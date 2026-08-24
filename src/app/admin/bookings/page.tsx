import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { MapPin } from "lucide-react";
import { Prisma, type BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireStaff } from "@/lib/auth/guards";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BookingReviewDialog } from "@/components/admin/booking-review-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = { title: "Bookings" };

const FILTERS = ["ALL", "PENDING", "APPROVED", "COMPLETED", "REJECTED", "CANCELLED"] as const;
const VALID = ["PENDING", "APPROVED", "COMPLETED", "REJECTED", "CANCELLED"];

function peso(amount: unknown) {
  return amount == null ? "—" : `₱${Number(amount).toLocaleString("en-PH")}`;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireStaff();
  const sp = await searchParams;
  const status = (sp.status || "PENDING").toUpperCase();

  const where: Prisma.BookingWhereInput = {};
  if (status !== "ALL" && VALID.includes(status)) where.status = status as BookingStatus;

  const [bookings, courts, staff] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        court: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.court.findMany({
      where: { status: "AVAILABLE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: { name: { in: ["STAFF", "ADMIN", "OWNER"] } }, isActive: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  const staffList = staff.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` }));

  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" description="Approve, assign, and manage court bookings." />

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/bookings?status=${f}`}
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

      {bookings.length === 0 ? (
        <EmptyState icon={MapPin} title="No bookings found" description="Booking requests will appear here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Court</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-medium">
                      {b.user.firstName} {b.user.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">{b.user.email}</div>
                  </TableCell>
                  <TableCell>{format(b.date, "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(b.startTime, "h:mm a")} – {format(b.endTime, "h:mm a")}
                  </TableCell>
                  <TableCell>{b.court?.name ?? "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>{peso(b.price)}</TableCell>
                  <TableCell className="text-right">
                    {["PENDING", "APPROVED"].includes(b.status) ? (
                      <BookingReviewDialog
                        booking={{
                          id: b.id,
                          member: `${b.user.firstName} ${b.user.lastName}`,
                          status: b.status,
                          courtId: b.courtId,
                          dateLabel: format(b.date, "MMM d"),
                          timeLabel: `${format(b.startTime, "h:mm a")}–${format(b.endTime, "h:mm a")}`,
                        }}
                        courts={courts}
                        staff={staffList}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {b.invoiceNumber ?? "—"}
                      </span>
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
